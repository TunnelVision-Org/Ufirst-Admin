import { NextApiRequest, NextApiResponse } from "next";
import { GADGET_API_URL, GADGET_API_KEY } from "@/config/api";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { id } = req.query;

    if (!id || typeof id !== 'string') {
        return res.status(400).json({ error: 'Client ID is required' });
    }

    if (!GADGET_API_KEY) {
        return res.status(500).json({ error: 'Server configuration error: Missing API key' });
    }

    try {
        console.log('🔍 [clients/getById] Fetching client:', id);
        const response = await fetch(GADGET_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${GADGET_API_KEY}`,
            },
            body: JSON.stringify({
                query: `
                    query GetClientById($id: GadgetID!) {
                        client(id: $id) {
                            id
                            userId
                            trainerId
                            user {
                                id
                                firstName
                                lastName
                                email
                            }
                            trainer {
                                id
                                user {
                                    firstName
                                    lastName
                                }
                            }
                            workouts {
                                edges {
                                    node {
                                        id
                                    }
                                }
                            }
                            mealPlan {
                                edges {
                                    node {
                                        id
                                    }
                                }
                            }
                            weightTrend {
                                edges {
                                    node {
                                        id
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
            console.error('❌ [clients/getById] GraphQL errors:', result.errors);
            return res.status(400).json({ error: 'GraphQL errors', details: result.errors });
        }

        if (result.data?.client) {
            const node = result.data.client;
            const trainerFirstName = node.trainer?.user?.firstName || '';
            const trainerLastName = node.trainer?.user?.lastName || '';

            const client = {
                id: node.id,
                userId: node.userId,
                trainerId: node.trainerId,
                name: `${node.user?.firstName || ''} ${node.user?.lastName || ''}`.trim(),
                firstName: node.user?.firstName,
                lastName: node.user?.lastName,
                email: node.user?.email,
                trainerName: `${trainerFirstName} ${trainerLastName}`.trim() || 'Unassigned',
                workoutCount: node.workouts?.edges?.length || 0,
                mealPlanCount: node.mealPlan?.edges?.length || 0,
                weightTrendCount: node.weightTrend?.edges?.length || 0,
                createdAt: node.createdAt,
                updatedAt: node.updatedAt,
            };

            console.log('✅ [clients/getById] Client found:', client.name);
            res.status(200).json({ success: true, client });
        } else {
            console.log('❌ [clients/getById] Client not found');
            res.status(404).json({ error: "Client not found" });
        }
    } catch (error) {
        console.error("❌ [clients/getById] Error:", error);
        res.status(500).json({ 
            error: 'Internal server error', 
            details: error instanceof Error ? error.message : 'Unknown error' 
        });
    }
}
