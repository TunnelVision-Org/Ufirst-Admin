import { NextApiRequest, NextApiResponse } from "next";
import { GADGET_API_URL, GADGET_API_KEY } from "@/config/api";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { id } = req.query;

    if (!id || typeof id !== 'string') {
        return res.status(400).json({ error: 'Trainer ID is required' });
    }

    if (!GADGET_API_KEY) {
        return res.status(500).json({ error: 'Server configuration error: Missing API key' });
    }

    try {
        const response = await fetch(GADGET_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${GADGET_API_KEY}`,
            },
            body: JSON.stringify({
                query: `
                    query GetTrainerById($id: GadgetID!) {
                        trainer(id: $id) {
                            id
                            userId
                            user {
                                id
                                firstName
                                lastName
                                email
                            }
                            client {
                                edges {
                                    node {
                                        id
                                        user {
                                            id
                                            firstName
                                            lastName
                                            email
                                        }
                                        workouts {
                                            edges {
                                                node {
                                                    id
                                                }
                                            }
                                        }
                                        mealPlan {
                                            id
                                        }
                                        createdAt
                                    }
                                }
                            }
                            createdAt
                            updatedAt
                        }
                    }
                `,
                variables: { id },
            }),
        });

        const result = await response.json();

        if (result.errors) {
            console.error('❌ [trainers/getById] GraphQL errors:', result.errors);
            return res.status(400).json({ error: 'GraphQL errors', details: result.errors });
        }

        if (result.data?.trainer) {
            const trainerData = result.data.trainer;
            const trainer = {
                id: trainerData.id,
                userId: trainerData.userId,
                name: `${trainerData.user?.firstName || ''} ${trainerData.user?.lastName || ''}`.trim(),
                firstName: trainerData.user?.firstName,
                lastName: trainerData.user?.lastName,
                email: trainerData.user?.email,
                clients: trainerData.client?.edges?.map((e: any) => {
                    const clientNode = e.node;
                    return {
                        id: clientNode.id,
                        name: `${clientNode.user?.firstName || ''} ${clientNode.user?.lastName || ''}`.trim(),
                        firstName: clientNode.user?.firstName,
                        lastName: clientNode.user?.lastName,
                        email: clientNode.user?.email,
                        userId: clientNode.user?.id,
                        workoutCount: clientNode.workouts?.edges?.length || 0,
                        mealPlanCount: clientNode.mealPlan ? 1 : 0,
                        joinDate: clientNode.createdAt,
                    };
                }) || [],
                clientCount: trainerData.client?.edges?.length || 0,
                hireDate: trainerData.createdAt,
                createdAt: trainerData.createdAt,
                updatedAt: trainerData.updatedAt,
                phone: '',
                specialization: '',
                rating: 0,
            };

            console.log('✅ [trainers/getById] Trainer found with', trainer.clientCount, 'clients');
            res.status(200).json({ success: true, trainer });
        } else {
            console.log('❌ [trainers/getById] Trainer not found');
            res.status(404).json({ error: "Trainer not found" });
        }
    } catch (error) {
        console.error("Get trainer error:", error);
        res.status(500).json({ error: 'Internal server error' });
    }
}
