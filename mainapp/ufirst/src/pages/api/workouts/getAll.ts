import type { NextApiRequest, NextApiResponse } from 'next';
import { GADGET_API_URL, GADGET_API_KEY } from '@/config/api';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('🔍 [workouts/getAll] called', { method: req.method });

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!GADGET_API_KEY) {
    console.error('❌ [workouts/getAll] Missing GADGET_API_KEY');
    return res.status(500).json({ error: 'Server configuration error: Missing API key' });
  }

  try {
    const response = await fetch(GADGET_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${GADGET_API_KEY}`,
      },
      body: JSON.stringify({
        query: `
          query GetAllWorkouts {
            workouts {
              edges {
                node {
                  id
                  name
                  exercises
                  dueDate
                  completed
                  createdAt
                  updatedAt
                  client { id }
                  trainer { id user { firstName lastName } }
                }
              }
            }
          }
        `,
      }),
    });

    const result = await response.json();
    console.log('📦 [workouts/getAll] gadget response received');

    if (result.errors) {
      console.error('❌ [workouts/getAll] GraphQL errors:', result.errors);
      return res.status(400).json({ error: 'GraphQL errors', details: result.errors });
    }

    if (result.data?.workouts) {
      // optional clientId filter from query params
      const clientId = typeof req.query.clientId === 'string' ? req.query.clientId : undefined;

      const workouts = result.data.workouts.edges.map((edge: any) => {
        const node = edge.node;
        const trainerFirstName = node.trainer?.user?.firstName || '';
        const trainerLastName = node.trainer?.user?.lastName || '';
        return {
          id: node.id,
          name: node.name,
          exercises: node.exercises,
          dueDate: node.dueDate,
          completed: !!node.completed,
          clientId: node.client?.id ?? null,
          trainerId: node.trainer?.id ?? null,
          trainerName: `${trainerFirstName} ${trainerLastName}`.trim() || 'Unassigned',
          createdAt: node.createdAt,
          updatedAt: node.updatedAt,
        };
      });

      const filtered = clientId ? workouts.filter((w: any) => w.clientId === clientId) : workouts;

      return res.status(200).json({ success: true, workouts: filtered });
    }

    console.warn('⚠️ [workouts/getAll] No workouts data in response');
    return res.status(400).json({ error: 'Failed to fetch workouts' });
  } catch (error) {
    console.error('❌ [workouts/getAll] Fetch error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
