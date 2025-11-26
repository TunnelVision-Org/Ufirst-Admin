import type { NextApiRequest, NextApiResponse } from 'next';
import { GADGET_API_URL, GADGET_API_KEY } from '@/config/api';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('🔍 [mealPlans/getAll] called', { method: req.method });

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!GADGET_API_KEY) {
    console.error('❌ [mealPlans/getAll] Missing GADGET_API_KEY');
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
          query GetAllMealPlans {
            mealPlans {
              edges {
                node {
                  id
                  name
                  description
                  client { id }
                  trainer { id user { firstName lastName } }
                  createdAt
                  updatedAt
                }
              }
            }
          }
        `,
      }),
    });

    const result = await response.json();
    console.log('📦 [mealPlans/getAll] gadget response received');

    if (result.errors) {
      console.error('❌ [mealPlans/getAll] GraphQL errors:', result.errors);
      return res.status(400).json({ error: 'GraphQL errors', details: result.errors });
    }

    if (result.data?.mealPlans) {
      // optional clientId filter from query params
      const clientId = typeof req.query.clientId === 'string' ? req.query.clientId : undefined;

      const plans = result.data.mealPlans.edges.map((edge: any) => {
        const node = edge.node;
        const trainerFirstName = node.trainer?.user?.firstName || '';
        const trainerLastName = node.trainer?.user?.lastName || '';
        return {
          id: node.id,
          name: node.name,
          description: node.description,
          clientId: node.client?.id ?? null,
          trainerId: node.trainer?.id ?? null,
          trainerName: `${trainerFirstName} ${trainerLastName}`.trim() || 'Unassigned',
          createdAt: node.createdAt,
          updatedAt: node.updatedAt,
        };
      });

      const filtered = clientId ? plans.filter((p: any) => p.clientId === clientId) : plans;

      return res.status(200).json({ success: true, mealPlans: filtered });
    }

    console.warn('⚠️ [mealPlans/getAll] No mealPlans data in response');
    return res.status(400).json({ error: 'Failed to fetch meal plans' });
  } catch (error) {
    console.error('❌ [mealPlans/getAll] Fetch error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
