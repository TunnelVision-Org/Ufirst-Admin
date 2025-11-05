import type { NextApiRequest, NextApiResponse } from 'next';
import { GADGET_API_URL, GADGET_API_KEY } from '@/config/api';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST' && req.method !== 'PUT') return res.status(405).json({ error: 'Method not allowed' });

  const { id, name, exercises, dueDate, completed, clientId, trainerId } = req.body;
  if (!id) return res.status(400).json({ error: 'id is required' });

  if (!GADGET_API_KEY) return res.status(500).json({ error: 'Server configuration error: Missing API key' });

  try {
    const workoutInput: any = {};
    if (typeof name !== 'undefined') workoutInput.name = name?.trim?.() ?? name;
    if (typeof exercises !== 'undefined') workoutInput.exercises = exercises;
    if (typeof dueDate !== 'undefined') {
      const parsed = new Date(dueDate);
      if (isNaN(parsed.getTime())) {
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
          mutation UpdateWorkout($id: GadgetID!, $workout: UpdateWorkoutInput!) {
            updateWorkout(id: $id, workout: $workout) {
              success
              errors { message code }
              workout { id name exercises dueDate completed updatedAt }
            }
          }
        `,
        variables: { id, workout: workoutInput },
      }),
    });

    const result = await response.json();
    if (result.errors) return res.status(400).json({ error: 'GraphQL errors', details: result.errors });
    if (!result.data?.updateWorkout) return res.status(500).json({ error: 'Unexpected response', details: result });

    const payload = result.data.updateWorkout;
    if (!payload.success) return res.status(400).json({ error: 'Failed to update', details: payload.errors });

    return res.status(200).json({ success: true, workout: payload.workout });
  } catch (error) {
    console.error('[workouts/update] error', error);
    return res.status(500).json({ error: 'Internal server error', details: error instanceof Error ? error.message : String(error) });
  }
}
