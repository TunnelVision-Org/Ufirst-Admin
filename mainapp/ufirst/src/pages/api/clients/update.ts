import { NextApiRequest, NextApiResponse } from "next";
import { GADGET_API_URL, GADGET_API_KEY } from "@/config/api";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'PUT') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { clientId, userId, firstName, lastName, email, trainerId } = req.body;

    if (!clientId || !userId) {
        return res.status(400).json({ error: 'Client ID and User ID are required' });
    }

    if (!GADGET_API_KEY) {
        return res.status(500).json({ error: 'Server configuration error: Missing API key' });
    }

    try {
        // Update user information if provided
        if (firstName || lastName || email) {
            console.log('🔍 [clients/update] Updating user information...');
            const updateUserResponse = await fetch(GADGET_API_URL, {
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
                            }
                        }
                    `,
                    variables: { 
                        id: userId,
                        firstName,
                        lastName,
                        email
                    },
                }),
            });

            const userResult = await updateUserResponse.json();

            if (userResult.errors || !userResult.data?.updateUser?.success) {
                console.error('❌ [clients/update] Failed to update user:', userResult.errors);
                const errorMessage = userResult.data?.updateUser?.errors?.[0]?.message || 'Failed to update user';
                return res.status(400).json({ error: errorMessage, details: userResult.errors });
            }
            console.log('✅ [clients/update] User information updated');
        }

        // Update client trainer assignment if provided
        if (trainerId !== undefined) {
            console.log('🔍 [clients/update] Updating trainer assignment...');
            const updateClientResponse = await fetch(GADGET_API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${GADGET_API_KEY}`,
                },
                body: JSON.stringify({
                    query: `
                        mutation UpdateClient($id: GadgetID!, $trainerId: GadgetID) {
                            updateClient(id: $id, client: {
                                trainerId: $trainerId
                            }) {
                                success
                                errors {
                                    message
                                }
                            }
                        }
                    `,
                    variables: { 
                        id: clientId,
                        trainerId: trainerId || null
                    },
                }),
            });

            const clientResult = await updateClientResponse.json();

            if (clientResult.errors || !clientResult.data?.updateClient?.success) {
                console.error('❌ [clients/update] Failed to update client:', clientResult.errors);
                const errorMessage = clientResult.data?.updateClient?.errors?.[0]?.message || 'Failed to update client';
                return res.status(400).json({ error: errorMessage, details: clientResult.errors });
            }
            console.log('✅ [clients/update] Trainer assignment updated');
        }

        res.status(200).json({ success: true, message: 'Client updated successfully' });
    } catch (error) {
        console.error("❌ [clients/update] Error:", error);
        res.status(500).json({ 
            error: 'Internal server error', 
            details: error instanceof Error ? error.message : 'Unknown error' 
        });
    }
}
