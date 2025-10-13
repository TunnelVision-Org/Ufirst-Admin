import { NextApiRequest, NextApiResponse } from "next";
import { GADGET_API_URL, GADGET_API_KEY } from "@/config/api";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'PUT' && req.method !== 'PATCH') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { id, userId, firstName, lastName, email } = req.body;

    if (!id || !userId) {
        return res.status(400).json({ error: 'Trainer ID and User ID are required' });
    }

    if (!GADGET_API_KEY) {
        return res.status(500).json({ error: 'Server configuration error: Missing API key' });
    }

    try {
        // Update the user information (firstName, lastName, email)
        const response = await fetch(GADGET_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${GADGET_API_KEY}`,
            },
            body: JSON.stringify({
                query: `
                    mutation UpdateUser($id: GadgetID!, $firstName: String, $lastName: String, $email: String) {
                        updateUser(id: $id, user: {
                            firstName: $firstName
                            lastName: $lastName
                            email: $email
                        }) {
                            success
                            errors {
                                message
                            }
                            user {
                                id
                                firstName
                                lastName
                                email
                            }
                        }
                    }
                `,
                variables: {
                    id: userId,
                    firstName,
                    lastName,
                    email,
                },
            }),
        });

        const result = await response.json();

        if (result.data?.updateUser?.success) {
            res.status(200).json({
                success: true,
                user: result.data.updateUser.user,
                message: 'Trainer updated successfully',
            });
        } else {
            const errorMessage = result.data?.updateUser?.errors?.[0]?.message || 'Failed to update trainer';
            res.status(400).json({ error: errorMessage });
        }
    } catch (error) {
        console.error("Update trainer error:", error);
        res.status(500).json({ error: 'Internal server error' });
    }
}
