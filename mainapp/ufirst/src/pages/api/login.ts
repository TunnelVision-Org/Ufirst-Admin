import { NextApiRequest, NextApiResponse } from "next";
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const response = await fetch('https://tunnel-vision-fitness--development.gadget.app/api/graphql', {
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

    const result = await response.json();

    if (result.data?.signInUser?.user) {
      res.status(200).json(result.data.signInUser);
    } else {
      res.status(401).json({ error: 'Invalid credentials' });
    }
  } catch (error) {
    console.error('Sign-in error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}