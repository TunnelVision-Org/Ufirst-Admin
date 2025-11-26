import { NextApiRequest, NextApiResponse } from "next";
import { GADGET_API_URL } from "@/config/api";
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('🔐 [API/Login] Login attempt received');
  console.log('🔐 [API/Login] Method:', req.method);
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, password } = req.body;

  console.log('🔐 [API/Login] Email:', email);
  console.log('🔐 [API/Login] Password length:', password?.length);

  if (!email || !password) {
    console.error('❌ [API/Login] Missing email or password');
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    console.log('📡 [API/Login] Sending request to Gadget...');
    
    const response = await fetch(GADGET_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: `
          mutation SignInUser($email: String!, $password: String!){
            signInUser(email:$email, password: $password){
                user {
                id
                firstName
                lastName
                email
                }
                errors{
                message
                code
                }
            }
        }
        `,
        variables: { email, password },
      }),
    });

    console.log('📥 [API/Login] Gadget response status:', response.status);

    const result = await response.json();
    console.log('📦 [API/Login] Gadget response:', JSON.stringify(result, null, 2));

    if (result.data?.signInUser?.errors && result.data.signInUser.errors.length > 0) {
      const errors = result.data.signInUser.errors;
      console.error('❌ [API/Login] SignIn errors:', errors);
      return res.status(401).json({ 
        error: errors[0].message || 'Authentication failed',
        errors: errors 
      });
    }

    if (result.data?.signInUser?.user) {
      const user = result.data.signInUser.user;
      console.log('✅ [API/Login] Login successful for:', user.email);
      
      res.status(200).json({
        user: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
        }
      });
    } else {
      console.error('❌ [API/Login] No user returned from Gadget');
      res.status(401).json({ error: 'Invalid credentials' });
    }
  } catch (error) {
    console.error('❌ [API/Login] Exception:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}