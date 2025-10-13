import { NextApiRequest, NextApiResponse } from "next";
import { GADGET_API_URL, GADGET_API_KEY } from "@/config/api";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'DELETE') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { id } = req.body;

    if (!id) {
        return res.status(400).json({ error: 'Trainer ID is required' });
    }

    if (!GADGET_API_KEY) {
        return res.status(500).json({ error: 'Server configuration error: Missing API key' });
    }

    try {
        // Delete the trainer record
        const response = await fetch(GADGET_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${GADGET_API_KEY}`,
            },
            body: JSON.stringify({
                query: `
                    mutation DeleteTrainer($id: GadgetID!) {
                        deleteTrainer(id: $id) {
                            success
                            errors {
                                message
                            }
                        }
                    }
                `,
                variables: { id },
            }),
        });

        const result = await response.json();

        if (result.data?.deleteTrainer?.success) {
            res.status(200).json({
                success: true,
                message: 'Trainer deleted successfully',
            });
        } else {
            const errorMessage = result.data?.deleteTrainer?.errors?.[0]?.message || 'Failed to delete trainer';
            res.status(400).json({ error: errorMessage });
        }
    } catch (error) {
        console.error("Delete trainer error:", error);
        res.status(500).json({ error: 'Internal server error' });
    }
}
