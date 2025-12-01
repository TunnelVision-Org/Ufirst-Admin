import type { NextApiRequest, NextApiResponse } from 'next';
import { GADGET_API_URL, GADGET_API_KEY } from '@/config/api';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email } = req.query;

  if (!email || typeof email !== 'string') {
    return res.status(400).json({ error: 'Email is required' });
  }

  // Check if user is admin by email
  if (email.toLowerCase() === 'admin@ufirst.com') {
    console.log('👑 [API/GetTrainerByEmail] Admin user detected');
    return res.status(200).json({
      id: 'admin',
      odataId: 'admin',
      email: 'admin@ufirst.com',
      firstName: 'Admin',
      lastName: 'User',
      role: 'admin',
      clients: []
    });
  }

  try {
    console.log('🔍 [API/GetTrainerByEmail] Step 1: Finding user by email:', email);
    
    // Step 1: Find the user by email
    const userResponse = await fetch(GADGET_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GADGET_API_KEY}`,
      },
      body: JSON.stringify({
        query: `
          query GetUserByEmail($email: String!) {
            users(filter: { email: { equals: $email } }, first: 1) {
              edges {
                node {
                  id
                  firstName
                  lastName
                  email
                }
              }
            }
          }
        `,
        variables: { email },
      }),
    });

    if (!userResponse.ok) {
      throw new Error(`Gadget API error (user lookup): ${userResponse.statusText}`);
    }

    const userResult = await userResponse.json();
    console.log('📦 [API/GetTrainerByEmail] User lookup result:', JSON.stringify(userResult, null, 2));

    if (userResult.errors) {
      console.error('❌ GraphQL errors (user lookup):', userResult.errors);
      return res.status(500).json({ error: 'Failed to fetch user', details: userResult.errors });
    }

    const userEdges = userResult.data?.users?.edges || [];
    
    if (userEdges.length === 0) {
      console.error('❌ User not found for email:', email);
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userEdges[0].node;
    console.log('✅ [API/GetTrainerByEmail] Found user ID:', user.id);

    // Step 2: Check if this user is a client (not a trainer)
    console.log('🔍 [API/GetTrainerByEmail] Step 2: Checking if user is a client...');
    
    const clientResponse = await fetch(GADGET_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GADGET_API_KEY}`,
      },
      body: JSON.stringify({
        query: `
          query GetClientByUserId($userId: GadgetID!) {
            clients(filter: { userId: { equals: $userId } }, first: 1) {
              edges {
                node {
                  id
                  userId
                  trainerId
                  user {
                    id
                    email
                    firstName
                    lastName
                  }
                  trainer {
                    id
                    user {
                      id
                      firstName
                      lastName
                      email
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
                  }
                  createdAt
                }
              }
            }
          }
        `,
        variables: { userId: user.id },
      }),
    });

    if (!clientResponse.ok) {
      throw new Error(`Gadget API error (client lookup): ${clientResponse.statusText}`);
    }

    const clientResult = await clientResponse.json();
    console.log('� [API/GetTrainerByEmail] Client lookup result:', JSON.stringify(clientResult, null, 2));

    if (clientResult.errors) {
      console.error('❌ GraphQL errors (client lookup):', clientResult.errors);
      return res.status(500).json({ error: 'Failed to fetch client', details: clientResult.errors });
    }

    const clientEdges = clientResult.data?.clients?.edges || [];
    
    // If user is a client, return their own data (they're not managing other clients)
    if (clientEdges.length > 0) {
      const client = clientEdges[0].node;
      console.log('✅ [API/GetTrainerByEmail] User is a CLIENT (not a trainer), ID:', client.id);
      
      // Return the client's own data - they have no "clients" to manage
      const clientData = {
        id: client.id,
        name: `${client.user.firstName} ${client.user.lastName}`,
        firstName: client.user.firstName,
        lastName: client.user.lastName,
        email: client.user.email,
        userId: client.userId,
        isClient: true,
        trainer: client.trainer ? {
          id: client.trainer.id,
          name: `${client.trainer.user.firstName} ${client.trainer.user.lastName}`,
          email: client.trainer.user.email,
        } : null,
        workoutCount: client.workouts?.edges?.length || 0,
        mealPlanCount: client.mealPlan ? 1 : 0,
        joinDate: client.createdAt,
        clients: [], // Clients don't have clients
      };
      
      return res.status(200).json(clientData);
    }

    // Step 3: If not a client, check if they're a trainer
    console.log('🔍 [API/GetTrainerByEmail] Step 3: User is not a client, checking if trainer...');
    
    const trainerResponse = await fetch(GADGET_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GADGET_API_KEY}`,
      },
      body: JSON.stringify({
        query: `
          query GetTrainerByUserId($userId: GadgetID!) {
            trainers(filter: { userId: { equals: $userId } }, first: 1) {
              edges {
                node {
                  id
                  userId
                  user {
                    id
                    email
                    firstName
                    lastName
                  }
                  client {
                    edges {
                      node {
                        id
                        userId
                        createdAt
                        user {
                          id
                          email
                          firstName
                          lastName
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
                      }
                    }
                  }
                }
              }
            }
          }
        `,
        variables: { userId: user.id },
      }),
    });

    if (!trainerResponse.ok) {
      throw new Error(`Gadget API error (trainer lookup): ${trainerResponse.statusText}`);
    }

    const trainerResult = await trainerResponse.json();
    console.log('📦 [API/GetTrainerByEmail] Trainer lookup result:', JSON.stringify(trainerResult, null, 2));

    if (trainerResult.errors) {
      console.error('❌ GraphQL errors (trainer lookup):', trainerResult.errors);
      return res.status(500).json({ error: 'Failed to fetch trainer', details: trainerResult.errors });
    }

    const trainerEdges = trainerResult.data?.trainers?.edges || [];
    
    if (trainerEdges.length === 0) {
      console.error('❌ User is neither a client nor a trainer');
      return res.status(404).json({ error: 'No client or trainer profile found for this user' });
    }

    const trainer = trainerEdges[0].node;
    console.log('✅ [API/GetTrainerByEmail] Found trainer ID:', trainer.id);

    // Transform clients data
    const clients = trainer.client?.edges?.map((edge: any) => {
      const client = edge.node;
      return {
        id: client.id,
        name: `${client.user?.firstName || ''} ${client.user?.lastName || ''}`.trim(),
        firstName: client.user?.firstName,
        lastName: client.user?.lastName,
        email: client.user?.email,
        userId: client.userId,
        workoutCount: client.workouts?.edges?.length || 0,
        mealPlanCount: client.mealPlan ? 1 : 0,
        joinDate: client.createdAt,
        createdAt: client.createdAt,
      };
    }) || [];
    
    console.log(`✅ [API/GetTrainerByEmail] Trainer has ${clients.length} client(s)`);

    const trainerData = {
      id: trainer.id,
      name: `${trainer.user.firstName} ${trainer.user.lastName}`,
      firstName: trainer.user.firstName,
      lastName: trainer.user.lastName,
      email: trainer.user.email,
      userId: trainer.userId,
      isClient: false,
      clientCount: clients.length,
      clients,
    };

    return res.status(200).json(trainerData);
  } catch (error) {
    console.error('Error fetching trainer by email:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
