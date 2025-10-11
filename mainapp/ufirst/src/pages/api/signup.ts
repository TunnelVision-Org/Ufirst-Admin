import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse){
    if (req.method !== 'POST'){
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { firstName, lastName, email, password } = req.body;

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
                    mutation SignUpUser($firstName: String!, $lastName: String!, $email: String!, $password:String!){
                        signUpUser(firstName: $firstName, lastName: $lastName, email:$email, password:$password){
                            success
                            errors{
                                message
                                code
                            }
                            actionRun
                            result
                        }
                    }
                `,
                variables: { firstName, lastName, email, password },
            }),
        });

        const result = await response.json();

        if (result.data.signUpUser.success) {
            res.status(200).json({success: true});
        } else {
            res.status(400).json({ error: "Something went wrong!" })
        }
    } catch (error) {
        console.error("Sign up error:", error);
        res.status(500).json({ error: 'Internal server error' })
    }
}