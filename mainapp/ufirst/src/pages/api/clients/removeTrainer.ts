import { NextApiRequest, NextApiResponse } from "next";
import { GADGET_API_URL, GADGET_API_KEY } from "@/config/api";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'PUT') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { clientId } = req.body;

    if (!clientId) {
        return res.status(400).json({ error: 'Client ID is required' });
    }

    if (!GADGET_API_KEY) {
        return res.status(500).json({ error: 'Server configuration error: Missing API key' });
    }

    try {
        console.log('🔍 [clients/removeTrainer] Removing trainer from client', clientId);
        const response = await fetch(GADGET_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${GADGET_API_KEY}`,
            },
            body: JSON.stringify({
                query: `
                    mutation RemoveTrainer($clientId: GadgetID!) {
                        updateClient(id: $clientId, client: {
                            trainerId: null
                        }) {
                            success
                            errors {
                                message
                            }
                        }
                    }
                `,
                variables: { clientId },
            }),
        });

        const result = await response.json();

        if (result.errors || !result.data?.updateClient?.success) {
            console.error('❌ [clients/removeTrainer] Failed:', result.errors);
            const errorMessage = result.data?.updateClient?.errors?.[0]?.message || 'Failed to remove trainer';
            return res.status(400).json({ error: errorMessage, details: result.errors });
        }

        console.log('✅ [clients/removeTrainer] Trainer removed successfully');
        res.status(200).json({ success: true, message: 'Trainer removed successfully' });
    } catch (error) {
        console.error("❌ [clients/removeTrainer] Error:", error);
        res.status(500).json({ 
            error: 'Internal server error', 
            details: error instanceof Error ? error.message : 'Unknown error' 
        });
    }
}
