import { NextApiRequest, NextApiResponse } from "next";
import { GADGET_API_URL, GADGET_API_KEY } from "@/config/api";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { firstName, lastName, email, password, trainerId } = req.body;

    if (!firstName || !lastName || !email) {
        return res.status(400).json({ error: 'First name, last name, and email are required' });
    }

    if (!GADGET_API_KEY) {
        return res.status(500).json({ error: 'Server configuration error: Missing API key' });
    }

    try {
        console.log('🔍 [clients/create] Creating user for client:', email);
        
        // First, create the user
        const createUserResponse = await fetch(GADGET_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${GADGET_API_KEY}`,
            },
            body: JSON.stringify({
                query: `
                    mutation CreateUser($firstName: String!, $lastName: String!, $email: String!, $password: String) {
                        createUser(user: {
                            firstName: $firstName
                            lastName: $lastName
                            email: $email
                            password: $password
                        }) {
                            success
                            user {
                                id
                                firstName
                                lastName
                                email
                            }
                            errors {
                                message
                            }
                        }
                    }
                `,
                variables: { 
                    firstName, 
                    lastName, 
                    email,
                    password: password || 'defaultPassword123' // Provide default if not specified
                },
            }),
        });

        const userResult = await createUserResponse.json();

        if (userResult.errors || !userResult.data?.createUser?.success) {
            console.error('❌ [clients/create] Failed to create user:', userResult.errors);
            const errorMessage = userResult.data?.createUser?.errors?.[0]?.message || 'Failed to create user';
            return res.status(400).json({ error: errorMessage, details: userResult.errors });
        }

        const userId = userResult.data.createUser.user.id;
        console.log('✅ [clients/create] User created with ID:', userId);

        // Then, create the client record
        console.log('🔍 [clients/create] Creating client record...');
        const createClientResponse = await fetch(GADGET_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${GADGET_API_KEY}`,
            },
            body: JSON.stringify({
                query: `
                    mutation CreateClient($userId: GadgetID!, $trainerId: GadgetID) {
                        createClient(client: {
                            userId: $userId
                            trainerId: $trainerId
                        }) {
                            success
                            client {
                                id
                                userId
                                trainerId
                                user {
                                    firstName
                                    lastName
                                    email
                                }
                                createdAt
                                updatedAt
                            }
                            errors {
                                message
                            }
                        }
                    }
                `,
                variables: { 
                    userId,
                    trainerId: trainerId || null
                },
            }),
        });

        const clientResult = await createClientResponse.json();

        if (clientResult.errors || !clientResult.data?.createClient?.success) {
            console.error('❌ [clients/create] Failed to create client:', clientResult.errors);
            const errorMessage = clientResult.data?.createClient?.errors?.[0]?.message || 'Failed to create client';
            return res.status(400).json({ error: errorMessage, details: clientResult.errors });
        }

        const client = clientResult.data.createClient.client;
        console.log('✅ [clients/create] Client created:', client.id);
        
        res.status(201).json({ 
            success: true,
            client: {
                id: client.id,
                userId: client.userId,
                trainerId: client.trainerId,
                name: `${client.user.firstName} ${client.user.lastName}`,
                firstName: client.user.firstName,
                lastName: client.user.lastName,
                email: client.user.email,
                createdAt: client.createdAt,
                updatedAt: client.updatedAt,
                workoutCount: 0,
                mealPlanCount: 0,
                weightTrendCount: 0,
            }
        });
    } catch (error) {
        console.error("❌ [clients/create] Error:", error);
        res.status(500).json({ 
            error: 'Internal server error', 
            details: error instanceof Error ? error.message : 'Unknown error' 
        });
    }
}
