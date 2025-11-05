import type { NextApiRequest, NextApiResponse } from 'next';
import { GADGET_API_URL, GADGET_API_KEY } from '@/config/api';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('🔧 [mealPlans/delete] called', { method: req.method });

  if (req.method !== 'POST' && req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const id = req.body?.id ?? (req.query?.id as string | undefined);
  if (!id) return res.status(400).json({ error: 'id is required' });

  if (!GADGET_API_KEY) {
    console.error('❌ [mealPlans/delete] Missing GADGET_API_KEY');
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
          mutation DeleteMealPlan($id: GadgetID!) {
            deleteMealPlan(id: $id) {
              success
              errors { message code }
            }
          }
        `,
        variables: { id },
      }),
    });

    const result = await response.json();
    console.log('📦 [mealPlans/delete] gadget response received');

    if (result.errors) {
      console.error('❌ [mealPlans/delete] GraphQL errors:', result.errors);
      return res.status(400).json({ error: 'GraphQL errors', details: result.errors });
    }

    if (result.errors) {
      console.error('❌ [mealPlans/delete] GraphQL errors:', result.errors);
      return res.status(400).json({ error: 'GraphQL errors', details: result.errors });
    }

    const payload = result.data?.deleteMealPlan;
    if (!payload) {
      console.error('❌ [mealPlans/delete] Unexpected response shape', result);
      return res.status(500).json({ error: 'Unexpected response from backend', details: result });
    }

    if (!payload.success) {
      const msg = payload.errors?.[0]?.message || 'Failed to delete meal plan';
      return res.status(400).json({ error: msg, details: payload.errors });
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('❌ [mealPlans/delete] Fetch error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
