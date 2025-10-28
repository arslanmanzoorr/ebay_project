import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  try {
    const { url_main } = req.body || {};
    if (!url_main || typeof url_main !== 'string') {
      return res.status(400).json({ error: 'url_main is required' });
    }

    const webhookUrl = 'https://sorcer.app.n8n.cloud/webhook/789023dc-a9bf-459c-8789-d9d0c993d1cb';
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ url_main })
    });

    const responseText = await response.text();
    if (!response.ok) {
      return res.status(response.status).json({
        error: 'n8n webhook request failed',
        status: response.status,
        body: responseText
      });
    }

    let responseData: any = null;
    if (responseText.trim()) {
      try {
        responseData = JSON.parse(responseText);
      } catch (parseError) {
        responseData = responseText;
      }
    }

    return res.status(200).json({
      success: true,
      data: responseData
    });
  } catch (error) {
    console.error('Error calling n8n webhook:', error);
    return res.status(500).json({
      error: 'Failed to call n8n webhook',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
