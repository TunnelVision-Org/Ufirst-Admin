import type { NextApiRequest, NextApiResponse } from 'next';
import { GADGET_API_URL, GADGET_API_KEY } from '@/config/api';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('🔍 [mealPlans/getById] called', { method: req.method });

  const id = req.method === 'GET' ? (req.query.id as string | undefined) : (req.body && req.body.id);
  if (!id) return res.status(400).json({ error: 'id is required' });

  if (!GADGET_API_KEY) {
    console.error('❌ [mealPlans/getById] Missing GADGET_API_KEY');
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
          query GetMealPlanById($id: ID!) {
            mealPlan(id: $id) {
              id
              name
              description
              client { id }
              trainer { id user { firstName lastName } }
              createdAt
              updatedAt
            }
          }
        `,
        variables: { id },
      }),
    });

    const result = await response.json();
    console.log('📦 [mealPlans/getById] gadget response received');

    if (result.errors) {
      console.error('❌ [mealPlans/getById] GraphQL errors:', result.errors);
      return res.status(400).json({ error: 'GraphQL errors', details: result.errors });
    }

    const node = result.data?.mealPlan;
    if (!node) return res.status(404).json({ error: 'Meal plan not found' });

    const trainerFirstName = node.trainer?.user?.firstName || '';
    const trainerLastName = node.trainer?.user?.lastName || '';

    const mealPlan = {
      id: node.id,
      name: node.name,
      description: node.description,
      clientId: node.client?.id ?? null,
      trainerId: node.trainer?.id ?? null,
      trainerName: `${trainerFirstName} ${trainerLastName}`.trim() || 'Unassigned',
      createdAt: node.createdAt,
      updatedAt: node.updatedAt,
    };

    return res.status(200).json({ success: true, mealPlan });
  } catch (error) {
    console.error('❌ [mealPlans/getById] Fetch error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
