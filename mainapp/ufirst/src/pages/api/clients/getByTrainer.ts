import { NextApiRequest, NextApiResponse } from "next";
import { GADGET_API_URL, GADGET_API_KEY } from "@/config/api";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { trainerId } = req.query;

    if (!trainerId || typeof trainerId !== 'string') {
        return res.status(400).json({ error: 'Trainer ID is required' });
    }

    if (!GADGET_API_KEY) {
        return res.status(500).json({ error: 'Server configuration error: Missing API key' });
    }

    try {
        console.log('🔍 [clients/getByTrainer] Fetching clients for trainer:', trainerId);
        const response = await fetch(GADGET_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${GADGET_API_KEY}`,
            },
            body: JSON.stringify({
                query: `
                    query GetClientsByTrainer($trainerId: GadgetID!) {
                        clients(filter: { trainerId: { equals: $trainerId } }) {
                            edges {
                                node {
                                    id
                                    userId
                                    trainerId
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
                        }
                    }
                `,
                variables: { trainerId },
            }),
        });

        const result = await response.json();

        if (result.errors) {
            console.error('❌ [clients/getByTrainer] GraphQL errors:', result.errors);
            return res.status(400).json({ error: 'GraphQL errors', details: result.errors });
        }

        if (result.data?.clients) {
            const clients = result.data.clients.edges.map((edge: any) => {
                const node = edge.node;
                return {
                    id: node.id,
                    userId: node.userId,
                    trainerId: node.trainerId,
                    name: `${node.user?.firstName || ''} ${node.user?.lastName || ''}`.trim(),
                    firstName: node.user?.firstName,
                    lastName: node.user?.lastName,
                    email: node.user?.email,
                    workoutCount: node.workouts?.edges?.length || 0,
                    mealPlanCount: node.mealPlan?.edges?.length || 0,
                    weightTrendCount: node.weightTrend?.edges?.length || 0,
                    createdAt: node.createdAt,
                    updatedAt: node.updatedAt,
                };
            });

            console.log('✅ [clients/getByTrainer] Clients found:', clients.length);
            res.status(200).json({ success: true, clients });
        } else {
            console.log('⚠️ [clients/getByTrainer] No clients found for trainer');
            res.status(200).json({ success: true, clients: [] });
        }
    } catch (error) {
        console.error("❌ [clients/getByTrainer] Error:", error);
        res.status(500).json({ 
            error: 'Internal server error', 
            details: error instanceof Error ? error.message : 'Unknown error' 
        });
    }
}
