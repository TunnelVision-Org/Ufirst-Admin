import { NextApiRequest, NextApiResponse } from "next";
import { GADGET_API_URL, GADGET_API_KEY } from "@/config/api";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'DELETE') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { id } = req.body;

    if (!id) {
        return res.status(400).json({ error: 'Client ID is required' });
    }

    if (!GADGET_API_KEY) {
        return res.status(500).json({ error: 'Server configuration error: Missing API key' });
    }

    try {
        // First, get the client to find the associated userId
        console.log('🔍 [clients/delete] Fetching client to get userId...');
        const getClientResponse = await fetch(GADGET_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${GADGET_API_KEY}`,
            },
            body: JSON.stringify({
                query: `
                    query GetClientForDelete($id: GadgetID!) {
                        client(id: $id) {
                            id
                            userId
                        }
                    }
                `,
                variables: { id },
            }),
        });

        const clientResult = await getClientResponse.json();

        if (clientResult.errors) {
            console.error('❌ [clients/delete] Failed to fetch client:', clientResult.errors);
            return res.status(400).json({ error: 'Failed to fetch client', details: clientResult.errors });
        }

        const client = clientResult.data?.client;
        if (!client) {
            console.error('❌ [clients/delete] Client not found');
            return res.status(404).json({ error: 'Client not found' });
        }

        const userId = client.userId;
        console.log('✅ [clients/delete] Found client with userId:', userId);

        // Delete the client record first
        console.log('🗑️ [clients/delete] Deleting client record...');
        const deleteClientResponse = await fetch(GADGET_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${GADGET_API_KEY}`,
            },
            body: JSON.stringify({
                query: `
                    mutation DeleteClient($id: GadgetID!) {
                        deleteClient(id: $id) {
                            success
                            errors {
                                message
                            }
                        }
                    }
                `,
                variables: { id },
            }),
        });

        const deleteClientResult = await deleteClientResponse.json();

        if (deleteClientResult.errors || !deleteClientResult.data?.deleteClient?.success) {
            console.error('❌ [clients/delete] Failed to delete client:', deleteClientResult.errors);
            const errorMessage = deleteClientResult.data?.deleteClient?.errors?.[0]?.message || 'Failed to delete client';
            return res.status(400).json({ error: errorMessage, details: deleteClientResult.errors });
        }

        console.log('✅ [clients/delete] Client record deleted');

        // Then delete the associated user record if it exists
        if (userId) {
            console.log('🗑️ [clients/delete] Deleting associated user record...');
            const deleteUserResponse = await fetch(GADGET_API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${GADGET_API_KEY}`,
                },
                body: JSON.stringify({
                    query: `
                        mutation DeleteUser($id: GadgetID!) {
                            deleteUser(id: $id) {
                                success
                                errors {
                                    message
                                }
                            }
                        }
                    `,
                    variables: { id: userId },
                }),
            });

            const deleteUserResult = await deleteUserResponse.json();

            if (deleteUserResult.errors || !deleteUserResult.data?.deleteUser?.success) {
                console.error('⚠️ [clients/delete] Warning: Failed to delete associated user:', deleteUserResult.errors);
                return res.status(200).json({ 
                    success: true, 
                    message: 'Client deleted but user deletion failed',
                    warning: 'Associated user account may still exist',
                    deletedClientId: id,
                    userId: userId
                });
            }

            console.log('✅ [clients/delete] User record deleted');
        }

        res.status(200).json({ 
            success: true, 
            message: 'Client and associated user deleted successfully',
            deletedClientId: id,
            deletedUserId: userId
        });
    } catch (error) {
        console.error("❌ [clients/delete] Error:", error);
        res.status(500).json({ 
            error: 'Internal server error', 
            details: error instanceof Error ? error.message : 'Unknown error' 
        });
    }
}
