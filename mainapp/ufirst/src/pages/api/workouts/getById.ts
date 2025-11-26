import type { NextApiRequest, NextApiResponse } from 'next';
import { GADGET_API_URL, GADGET_API_KEY } from '@/config/api';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('🔍 [workouts/getById] called', { method: req.method });

  const id = req.method === 'GET' ? (req.query.id as string | undefined) : (req.body && req.body.id);
  if (!id) return res.status(400).json({ error: 'id is required' });

  if (!GADGET_API_KEY) {
    console.error('❌ [workouts/getById] Missing GADGET_API_KEY');
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
          query GetWorkoutById($id: GadgetID!) {
            workout(id: $id) {
              id
              name
              exercises
              dueDate
              completed
              createdAt
              updatedAt
              client { id user { id firstName lastName email } }
              trainer { id user { id firstName lastName email } }
            }
          }
        `,
        variables: { id },
      }),
    });

    const result = await response.json();
    console.log('📦 [workouts/getById] gadget response received');

    if (result.errors) {
      console.error('❌ [workouts/getById] GraphQL errors:', result.errors);
      return res.status(400).json({ error: 'GraphQL errors', details: result.errors });
    }

    const node = result.data?.workout;
    if (!node) return res.status(404).json({ error: 'Workout not found' });

    const workout = {
      id: node.id,
      name: node.name,
      exercises: node.exercises,
      dueDate: node.dueDate,
      completed: !!node.completed,
      clientId: node.client?.id ?? null,
      trainerId: node.trainer?.id ?? null,
      createdAt: node.createdAt,
      updatedAt: node.updatedAt,
    };

    return res.status(200).json({ success: true, workout });
  } catch (error) {
    console.error('❌ [workouts/getById] Fetch error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
