import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    console.log('📝 [API/Signup] Signup attempt received');
    console.log('📝 [API/Signup] Method:', req.method);
    
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { firstName, lastName, email, password } = req.body;

    console.log('📝 [API/Signup] Email:', email);
    console.log('📝 [API/Signup] First Name:', firstName);
    console.log('📝 [API/Signup] Last Name:', lastName);
    console.log('📝 [API/Signup] Password length:', password?.length);

    if (!email || !password) {
        console.error('❌ [API/Signup] Missing email or password');
        return res.status(400).json({ error: 'Email and password are required' });
    }

    try {
        console.log('📡 [API/Signup] Sending request to Gadget...');
        
        const response = await fetch('https://tunnel-vision-fitness--brokemybranch.gadget.app/api/graphql', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                query: `
                    mutation SignUpUser($firstName: String!, $lastName: String!, $email: String!, $password: String!) {
                        signUpUser(firstName: $firstName, lastName: $lastName, email: $email, password: $password) {
                            success
                            errors {
                                message
                                code
                            }
                            result
                        }
                    }
                `,
                variables: { firstName, lastName, email, password },
            }),
        });

        console.log('📥 [API/Signup] Gadget response status:', response.status);

        const result = await response.json();
        console.log('📦 [API/Signup] Gadget response:', JSON.stringify(result, null, 2));

        // Check for GraphQL errors
        if (result.errors) {
            console.error('❌ [API/Signup] GraphQL errors:', result.errors);
            return res.status(400).json({ 
                error: result.errors[0]?.message || 'GraphQL error occurred',
                errors: result.errors
            });
        }

        // Check for mutation-level errors
        if (result.data?.signUpUser?.errors && result.data.signUpUser.errors.length > 0) {
            const errors = result.data.signUpUser.errors;
            console.error('❌ [API/Signup] SignUp errors:', errors);
            return res.status(400).json({ 
                error: errors[0].message || 'Signup failed',
                errors: errors 
            });
        }

        // Success case
        if (result.data?.signUpUser?.success) {
            console.log('✅ [API/Signup] Signup successful for:', email);
            
            res.status(200).json({
                success: true,
                result: result.data.signUpUser.result
            });
        } else {
            console.error('❌ [API/Signup] Signup was not successful');
            res.status(400).json({ error: 'Signup failed' });
        }
    } catch (error) {
        console.error('❌ [API/Signup] Exception:', error);
        res.status(500).json({ 
            error: 'Internal server error',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}