import type { NextApiRequest, NextApiResponse } from 'next';
import { GADGET_API_URL, GADGET_API_KEY } from '@/config/api';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('🔧 [workouts/create] called', { method: req.method });

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { name, exercises, dueDate, completed, clientId, trainerId } = req.body;
  if (!name || typeof name !== 'string' || name.trim() === '') {
    return res.status(400).json({ error: 'name is required' });
  }

  if (!GADGET_API_KEY) {
    console.error('❌ [workouts/create] Missing GADGET_API_KEY');
    return res.status(500).json({ error: 'Server configuration error: Missing API key' });
  }

  try {
    const workoutInput: any = { name: name.trim() };
    if (typeof exercises !== 'undefined') workoutInput.exercises = exercises;
    if (typeof dueDate !== 'undefined') {
      // Normalize dueDate to a full ISO DateTime that Gadget expects (with seconds and timezone)
      const parsed = new Date(dueDate);
      if (isNaN(parsed.getTime())) {
        // Try appending seconds if format is like 'YYYY-MM-DDTHH:MM'
        const maybeWithSeconds = `${dueDate}:00`;
        const parsed2 = new Date(maybeWithSeconds);
        if (isNaN(parsed2.getTime())) {
          return res.status(400).json({ error: 'Invalid dueDate format' });
        }
        workoutInput.dueDate = parsed2.toISOString();
      } else {
        workoutInput.dueDate = parsed.toISOString();
      }
    }
    if (typeof completed !== 'undefined') workoutInput.completed = completed;
    if (clientId) workoutInput.client = { _link: String(clientId) };
    if (trainerId) workoutInput.trainer = { _link: String(trainerId) };

    const response = await fetch(GADGET_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${GADGET_API_KEY}`,
      },
      body: JSON.stringify({
        query: `
          mutation CreateWorkout($workout: CreateWorkoutInput!) {
            createWorkout(workout: $workout) {
              success
              errors { message code }
              workout {
                id
                name
                exercises
                dueDate
                completed
                createdAt
                updatedAt
                client { id }
                trainer { id }
              }
            }
          }
        `,
        variables: { workout: workoutInput },
      }),
    });

    const result = await response.json();
    console.log('📦 [workouts/create] gadget response received');

    if (result.errors) {
      console.error('❌ [workouts/create] GraphQL errors:', result.errors);
      return res.status(400).json({ error: 'GraphQL errors', details: result.errors });
    }

    if (!result.data?.createWorkout) {
      console.error('❌ [workouts/create] Unexpected response shape', result);
      return res.status(500).json({ error: 'Unexpected response from backend', details: result });
    }

    const payload = result.data.createWorkout;
    if (!payload.success) {
      const msg = payload.errors?.[0]?.message || 'Failed to create workout';
      return res.status(400).json({ error: msg, details: payload.errors });
    }

    const created = payload.workout;
    if (!created) return res.status(500).json({ error: 'Failed to create workout' });

    return res.status(201).json({ success: true, workout: created });
  } catch (error) {
    console.error('❌ [workouts/create] Fetch error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
