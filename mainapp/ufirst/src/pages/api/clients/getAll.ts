import { NextApiRequest, NextApiResponse } from "next";
import { GADGET_API_URL, GADGET_API_KEY } from "@/config/api";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    console.log('🔍 [clients/getAll] API endpoint called');
    console.log('🔍 [clients/getAll] Method:', req.method);

    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    if (!GADGET_API_KEY) {
        console.error('❌ [clients/getAll] Missing GADGET_API_KEY');
        return res.status(500).json({ error: 'Server configuration error: Missing API key' });
    }

    try {
        console.log('📡 [clients/getAll] Fetching from Gadget.app...');
        const response = await fetch(GADGET_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${GADGET_API_KEY}`,
            },
            body: JSON.stringify({
                query: `
                    query GetAllClients {
                        clients {
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
                                        id
                                        name
                                        description
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
            }),
        });

        const result = await response.json();
        console.log('📦 [clients/getAll] Response received');

        if (result.errors) {
            console.error('❌ [clients/getAll] GraphQL errors:', result.errors);
            return res.status(400).json({ error: 'GraphQL errors', details: result.errors });
        }

        if (result.data?.clients) {
            const clients = result.data.clients.edges.map((edge: any) => {
                const node = edge.node;
                const trainerFirstName = node.trainer?.user?.firstName || '';
                const trainerLastName = node.trainer?.user?.lastName || '';
                
                return {
                    id: node.id,
                    userId: node.userId,
                    trainerId: node.trainerId,
                    name: `${node.user?.firstName || ''} ${node.user?.lastName || ''}`.trim(),
                    firstName: node.user?.firstName,
                    lastName: node.user?.lastName,
                    email: node.user?.email,
                    trainerName: `${trainerFirstName} ${trainerLastName}`.trim() || 'Unassigned',
                    workoutCount: node.workouts?.edges?.length || 0,
                    mealPlanCount: node.mealPlan ? 1 : 0,
                    weightTrendCount: node.weightTrend?.edges?.length || 0,
                    createdAt: node.createdAt,
                    updatedAt: node.updatedAt,
                };
            });

            console.log('✅ [clients/getAll] Clients found:', clients.length);
            res.status(200).json({ success: true, clients });
        } else {
            console.log('⚠️ [clients/getAll] No clients data in response');
            res.status(400).json({ error: "Failed to fetch clients" });
        }
    } catch (error) {
        console.error("❌ [clients/getAll] Fetch error:", error);
        res.status(500).json({ 
            error: 'Internal server error', 
            details: error instanceof Error ? error.message : 'Unknown error' 
        });
    }
}