import type { NextApiRequest, NextApiResponse } from 'next';
import { GADGET_API_URL, GADGET_API_KEY } from '@/config/api';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('🔧 [mealPlans/update] called', { method: req.method });

  if (req.method !== 'POST' && req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id, name, description, clientId, trainerId } = req.body;
  if (!id) return res.status(400).json({ error: 'id is required' });

  if (!GADGET_API_KEY) {
    console.error('❌ [mealPlans/update] Missing GADGET_API_KEY');
    return res.status(500).json({ error: 'Server configuration error: Missing API key' });
  }

  try {
    // Build patch according to Gadget's UpdateMealPlanInput shape
    const patch: any = {};
    if (typeof name !== 'undefined') patch.name = name;
    if (typeof description !== 'undefined') patch.description = description;
    if (clientId) patch.client = { _link: String(clientId) };
    if (trainerId) patch.trainer = { _link: String(trainerId) };

    const response = await fetch(GADGET_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${GADGET_API_KEY}`,
      },
      body: JSON.stringify({
        query: `
          mutation UpdateMealPlan($id: GadgetID!, $mealPlan: UpdateMealPlanInput!) {
            updateMealPlan(id: $id, mealPlan: $mealPlan) {
              success
              errors { message code }
              mealPlan {
                id
                name
                description
                client { id }
                trainer { id }
                createdAt
                updatedAt
              }
            }
          }
        `,
        variables: { id, mealPlan: patch },
      }),
    });

    const result = await response.json();
    console.log('📦 [mealPlans/update] gadget response received');

    if (result.errors) {
      console.error('❌ [mealPlans/update] GraphQL errors:', result.errors);
      return res.status(400).json({ error: 'GraphQL errors', details: result.errors });
    }

    if (result.errors) {
      console.error('❌ [mealPlans/update] GraphQL errors:', result.errors);
      return res.status(400).json({ error: 'GraphQL errors', details: result.errors });
    }

    if (!result.data?.updateMealPlan) {
      console.error('❌ [mealPlans/update] Unexpected response shape', result);
      return res.status(500).json({ error: 'Unexpected response from backend', details: result });
    }

    const payload = result.data.updateMealPlan;
    if (!payload.success) {
      const msg = payload.errors?.[0]?.message || 'Failed to update meal plan';
      return res.status(400).json({ error: msg, details: payload.errors });
    }

    const updated = payload.mealPlan;
    if (!updated) return res.status(404).json({ error: 'Meal plan not found or not updated' });

    return res.status(200).json({ success: true, mealPlan: updated });
  } catch (error) {
    console.error('❌ [mealPlans/update] Fetch error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
