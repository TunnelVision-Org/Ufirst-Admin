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
                    query GetTrainerById($id: ID!) {
                        trainer(id: $id) {
                            id
                            user {
                                id
                                firstName
                                lastName
                                email
                            }
                            workout {
                                id
                            }
                            mealPlan {
                                edges {
                                    node {
                                        id
                                    }
                                }
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

        if (result.data?.trainer) {
            const trainerData = result.data.trainer;
            const trainer = {
                id: trainerData.id,
                name: `${trainerData.user?.firstName || ''} ${trainerData.user?.lastName || ''}`.trim(),
                firstName: trainerData.user?.firstName,
                lastName: trainerData.user?.lastName,
                email: trainerData.user?.email,
                userId: trainerData.user?.id,
                workoutId: trainerData.workout?.id,
                mealPlans: trainerData.mealPlan?.edges?.map((e: any) => e.node) || [],
                clients: trainerData.client?.edges?.map((e: any) => ({
                    id: e.node.id,
                    name: `${e.node.user?.firstName || ''} ${e.node.user?.lastName || ''}`.trim(),
                    firstName: e.node.user?.firstName,
                    lastName: e.node.user?.lastName,
                    email: e.node.user?.email,
                    userId: e.node.user?.id,
                })) || [],
                hireDate: trainerData.createdAt,
                createdAt: trainerData.createdAt,
                updatedAt: trainerData.updatedAt,
                phone: '',
                specialization: '',
                rating: 0,
            };

            res.status(200).json({ success: true, trainer });
        } else {
            res.status(404).json({ error: "Trainer not found" });
        }
    } catch (error) {
        console.error("Get trainer error:", error);
        res.status(500).json({ error: 'Internal server error' });
    }
}
