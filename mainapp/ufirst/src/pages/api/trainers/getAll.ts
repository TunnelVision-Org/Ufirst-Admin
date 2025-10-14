import { NextApiRequest, NextApiResponse } from "next";
import { GADGET_API_URL, GADGET_API_KEY } from "@/config/api";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    console.log('🔍 [getAll] API endpoint called');
    console.log('🔍 [getAll] Method:', req.method);
    console.log('🔍 [getAll] GADGET_API_URL:', GADGET_API_URL);
    console.log('🔍 [getAll] Has API Key:', !!GADGET_API_KEY);

    if (req.method !== 'GET') {
        console.log('❌ [getAll] Wrong method:', req.method);
        return res.status(405).json({ error: 'Method not allowed' });
    }

    if (!GADGET_API_KEY) {
        console.error('❌ [getAll] Missing GADGET_API_KEY environment variable');
        return res.status(500).json({ error: 'Server configuration error: Missing API key' });
    }

    try {
        console.log('📡 [getAll] Fetching from Gadget.app with authentication...');
        const response = await fetch(GADGET_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${GADGET_API_KEY}`,
            },
            body: JSON.stringify({
                query: `
                    query GetAllTrainers {
                        trainers {
                            edges {
                                node {
                                    id
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

        console.log('📥 [getAll] Response status:', response.status);
        console.log('📥 [getAll] Response ok:', response.ok);

        const result = await response.json();
        console.log('📦 [getAll] Full result:', JSON.stringify(result, null, 2));

        if (result.errors) {
            console.error('❌ [getAll] GraphQL errors:', result.errors);
            return res.status(400).json({ error: 'GraphQL errors', details: result.errors });
        }

        if (result.data?.trainers) {
            console.log('✅ [getAll] Trainers found:', result.data.trainers.edges?.length || 0);
            const trainers = result.data.trainers.edges.map((edge: any) => ({
                id: edge.node.id,
                name: `${edge.node.user?.firstName || ''} ${edge.node.user?.lastName || ''}`.trim(),
                firstName: edge.node.user?.firstName,
                lastName: edge.node.user?.lastName,
                email: edge.node.user?.email,
                userId: edge.node.user?.id,
                clientCount: edge.node.client?.edges?.length || 0,
                hireDate: edge.node.createdAt,
                createdAt: edge.node.createdAt,
                updatedAt: edge.node.updatedAt,
                // Fields left blank as per schema
                phone: '',
                specialization: '',
                rating: 0,
            }));

            res.status(200).json({ success: true, trainers });
        } else {
            res.status(400).json({ error: "Failed to fetch trainers" });
        }
    } catch (error) {
        console.error("Get trainers error:", error);
        res.status(500).json({ error: 'Internal server error' });
    }
}
