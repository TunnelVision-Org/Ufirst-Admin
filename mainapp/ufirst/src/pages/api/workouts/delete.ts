import type { NextApiRequest, NextApiResponse } from 'next';
import { GADGET_API_URL, GADGET_API_KEY } from '@/config/api';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST' && req.method !== 'DELETE') return res.status(405).json({ error: 'Method not allowed' });

  const { id } = req.body;
  if (!id) return res.status(400).json({ error: 'id is required' });

  if (!GADGET_API_KEY) return res.status(500).json({ error: 'Server configuration error: Missing API key' });

  try {
    const response = await fetch(GADGET_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${GADGET_API_KEY}`,
      },
      body: JSON.stringify({
        query: `
          mutation DeleteWorkout($id: GadgetID!) {
            deleteWorkout(id: $id) {
              success
              errors { message code }
            }
          }
        `,
        variables: { id },
      }),
    });

    const result = await response.json();
    if (result.errors) return res.status(400).json({ error: 'GraphQL errors', details: result.errors });
    if (!result.data?.deleteWorkout) return res.status(500).json({ error: 'Unexpected response', details: result });

    const payload = result.data.deleteWorkout;
    if (!payload.success) return res.status(400).json({ error: 'Failed to delete', details: payload.errors });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('[workouts/delete] error', error);
    return res.status(500).json({ error: 'Internal server error', details: error instanceof Error ? error.message : String(error) });
  }
}
