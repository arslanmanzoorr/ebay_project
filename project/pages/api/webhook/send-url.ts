import type { NextApiRequest, NextApiResponse } from 'next';
import { validateUrl } from '@/utils/urlValidation';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  try {
    const { url_main, adminId } = req.body || {};
    if (!url_main || typeof url_main !== 'string') {
      return res.status(400).json({ error: 'url_main is required' });
    }

    const validation = validateUrl(url_main);
    if (!validation.isValid) {
      return res.status(400).json({ error: validation.error || 'Invalid URL pattern' });
    }

    // Credit Check
    const { databaseService } = await import('@/services/database');
    const creditSettings = await databaseService.getCreditSettings();
    const itemFetchCost = creditSettings.item_fetch_cost || 1;

    // Check if admin has enough credits
    if (adminId) {
      const hasCredits = await databaseService.hasEnoughCredits(adminId, itemFetchCost);
      if (!hasCredits) {
        return res.status(403).json({
          error: 'Insufficient credits',
          code: 'INSUFFICIENT_CREDITS',
          required: itemFetchCost
        });
      }

      // Deduct credits immediately (before sending to n8n)
      await databaseService.deductCredits(
        adminId,
        itemFetchCost,
        `Item Fetch: ${url_main}`
      );
    }

    const webhookUrl = 'https://sorcer.app.n8n.cloud/webhook/789023dc-a9bf-459c-8789-d9d0c993d1cb';

    console.log(`[API] Sending URL to n8n for async processing: ${url_main}`);

    // Send to n8n asynchronously - don't wait for full processing
    // n8n will call /api/webhook/receive when done
    fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        url_main,
        ...(adminId ? { adminId } : {})
      })
    }).then(response => {
      console.log(`[API] n8n acknowledged URL: ${url_main}, status: ${response.status}`);
    }).catch(error => {
      console.error(`[API] Error sending to n8n (async): ${error.message}`);
    });

    // Return immediately - item will be created when n8n calls /api/webhook/receive
    return res.status(200).json({
      success: true,
      status: 'processing',
      message: 'URL submitted for processing. Item will appear when n8n completes.'
    });

  } catch (error) {
    console.error('Error calling n8n webhook:', error);
    return res.status(500).json({
      error: 'Failed to call n8n webhook',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
