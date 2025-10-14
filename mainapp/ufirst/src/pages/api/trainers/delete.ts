import { NextApiRequest, NextApiResponse } from "next";
import { GADGET_API_URL, GADGET_API_KEY } from "@/config/api";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'DELETE') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { id } = req.body;

    if (!id) {
        return res.status(400).json({ error: 'Trainer ID is required' });
    }

    if (!GADGET_API_KEY) {
        return res.status(500).json({ error: 'Server configuration error: Missing API key' });
    }

    try {
        // First, get the trainer to find the associated userId
        console.log('🔍 [delete] Fetching trainer to get userId...');
        const getTrainerResponse = await fetch(GADGET_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${GADGET_API_KEY}`,
            },
            body: JSON.stringify({
                query: `
                    query GetTrainerForDelete($id: GadgetID!) {
                        trainer(id: $id) {
                            id
                            userId
                        }
                    }
                `,
                variables: { id },
            }),
        });

        const trainerResult = await getTrainerResponse.json();

        if (trainerResult.errors) {
            console.error('❌ [delete] Failed to fetch trainer:', trainerResult.errors);
            return res.status(400).json({ error: 'Failed to fetch trainer', details: trainerResult.errors });
        }

        const trainer = trainerResult.data?.trainer;
        if (!trainer) {
            console.error('❌ [delete] Trainer not found');
            return res.status(404).json({ error: 'Trainer not found' });
        }

        const userId = trainer.userId;
        console.log('✅ [delete] Found trainer with userId:', userId);

        // Delete the trainer record first
        console.log('🗑️ [delete] Deleting trainer record...');
        const deleteTrainerResponse = await fetch(GADGET_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${GADGET_API_KEY}`,
            },
            body: JSON.stringify({
                query: `
                    mutation DeleteTrainer($id: GadgetID!) {
                        deleteTrainer(id: $id) {
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

        const deleteTrainerResult = await deleteTrainerResponse.json();

        if (deleteTrainerResult.errors || !deleteTrainerResult.data?.deleteTrainer?.success) {
            console.error('❌ [delete] Failed to delete trainer:', deleteTrainerResult.errors);
            const errorMessage = deleteTrainerResult.data?.deleteTrainer?.errors?.[0]?.message || 'Failed to delete trainer';
            return res.status(400).json({ error: errorMessage, details: deleteTrainerResult.errors });
        }

        console.log('✅ [delete] Trainer record deleted');

        // Then delete the associated user record if it exists
        if (userId) {
            console.log('🗑️ [delete] Deleting associated user record...');
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
                console.error('⚠️ [delete] Warning: Failed to delete associated user:', deleteUserResult.errors);
                // Continue anyway since trainer was deleted
                return res.status(200).json({ 
                    success: true, 
                    message: 'Trainer deleted but user deletion failed',
                    warning: 'Associated user account may still exist',
                    deletedTrainerId: id,
                    userId: userId
                });
            }

            console.log('✅ [delete] User record deleted');
        }

        res.status(200).json({ 
            success: true, 
            message: 'Trainer and associated user deleted successfully',
            deletedTrainerId: id,
            deletedUserId: userId
        });
    } catch (error) {
        console.error("❌ [delete] Delete trainer error:", error);
        res.status(500).json({ 
            error: 'Internal server error', 
            details: error instanceof Error ? error.message : 'Unknown error' 
        });
    }
}
