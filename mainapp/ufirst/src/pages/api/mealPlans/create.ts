import type { NextApiRequest, NextApiResponse } from 'next';
import { GADGET_API_URL, GADGET_API_KEY } from '@/config/api';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('🔧 [mealPlans/create] called', { method: req.method });

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { name, description, clientId, trainerId, meals } = req.body;
  if (!name || typeof name !== 'string' || name.trim() === '') {
    return res.status(400).json({ error: 'name is required' });
  }
  if (!description || typeof description !== 'string' || description.trim() === '') {
    return res.status(400).json({ error: 'description is required' });
  }

  if (!GADGET_API_KEY) {
    console.error('❌ [mealPlans/create] Missing GADGET_API_KEY');
    return res.status(500).json({ error: 'Server configuration error: Missing API key' });
  }

  try {
    console.log('🔍 [mealPlans/create] Creating meal plan for client:', clientId);

    // Build mealPlan input according to Gadget's CreateMealPlanInput shape.
    const mealPlanInput = {
    name: name.trim(),
    description: description.trim(),
    client: clientId ? { _link: String(clientId) } : undefined,
    trainer: trainerId ? { _link: String(trainerId) } : undefined
  };

      if (clientId !== undefined && clientId !== null && String(clientId).trim() !== '') {
        mealPlanInput.client = { _link: String(clientId) };
      }

      if (trainerId !== undefined && trainerId !== null && String(trainerId).trim() !== '') {
        mealPlanInput.trainer = { _link: String(trainerId) };
      }

    const response = await fetch(GADGET_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${GADGET_API_KEY}`,
      },
      body: JSON.stringify({
        query: `
          mutation CreateMealPlan($mealPlan: CreateMealPlanInput!) {
            createMealPlan(mealPlan: $mealPlan) {
              success
              errors { message code }
              mealPlan {
                id
                name
                description
                createdAt
                updatedAt
                client { id }
                trainer { id }
              }
            }
          }
        `,
        variables: { mealPlan: mealPlanInput },
      }),
    });

    const result = await response.json();
    console.log('📦 [mealPlans/create] gadget response received');

    // Retrieving the mealPlan ID through which we will create meals and assign them to mealplans
    const mealPlanId = result.data.createMealPlan.mealPlan.id;
    console.log(meals)

    meals.forEach(async (meal: { name: string; calories: number; carbs: number; fats: number; protein: number }) => {
      console.log(meal.name)
        const response = await fetch(GADGET_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${GADGET_API_KEY}`,
        },
        body: JSON.stringify({
          query: `
            mutation CreateMeal($mealInput: CreateMealInput!) {
              createMeal(meal: $mealInput) {
                success
                errors { message code }
              }
            }
          `,
          variables: { mealInput: {calories: meal.calories, carbs: meal.carbs, fats: meal.fats, protein: meal.protein, name: meal.name, mealPlan: { _link: mealPlanId }}},
        }),
      });

      const result = await response.json();
    });

    if (result.errors) {
      console.error('❌ [mealPlans/create] GraphQL errors:', result.errors);
      return res.status(400).json({ error: 'GraphQL errors', details: result.errors });
    }

    if (!result.data?.createMealPlan) {
      console.error('❌ [mealPlans/create] Unexpected response shape', result);
      return res.status(500).json({ error: 'Unexpected response from backend', details: result });
    }

    const payload = result.data.createMealPlan;
    if (!payload.success) {
      const msg = payload.errors?.[0]?.message || 'Failed to create meal plan';
      return res.status(400).json({ error: msg, details: payload.errors });
    }

    const created = payload.mealPlan;
    if (!created) return res.status(500).json({ error: 'Failed to create meal plan' });

    return res.status(201).json({ success: true, mealPlan: created });
  } catch (error) {
    console.error('❌ [mealPlans/create] Fetch error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
