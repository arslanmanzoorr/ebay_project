import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { itemData } = req.body;

    if (!itemData) {
      return res.status(400).json({ error: 'Item data is required' });
    }

    console.log('📤 Server-side: Sending data to external webhook:', itemData);

    // Prepare comprehensive data package
    const webhookData = {
      // Original scraped data
      originalData: {
        url: itemData.url,
        itemName: itemData.itemName,
        lotNumber: itemData.lotNumber,
        description: itemData.description,
        auctionName: itemData.auctionName,
        category: itemData.category,
        auctionSiteEstimate: itemData.auctionSiteEstimate,
        aiDescription: itemData.aiDescription,
        aiEstimate: itemData.aiEstimate,
        lead: itemData.lead,
        images: itemData.images,
        mainImageUrl: itemData.mainImageUrl,
        sku: itemData.sku
      },
      // Research data
      researchData: {
        researcherEstimate: itemData.researcherEstimate,
        researcherDescription: itemData.researcherDescription,
        referenceUrls: itemData.referenceUrls,
        priority: itemData.priority,
        notes: itemData.notes
      },
      // Photography data
      photographyData: {
        photographerImages: itemData.photographerImages,
        photographerQuantity: itemData.photographerQuantity
      },
      // Workflow information
      workflowInfo: {
        status: itemData.status,
        assignedTo: itemData.assignedTo,
        createdAt: itemData.createdAt,
        updatedAt: itemData.updatedAt,
        tags: itemData.tags
      },
      // System metadata
      metadata: {
        itemId: itemData.id,
        timestamp: new Date().toISOString(),
        source: 'Auction Management System'
      }
    };

    const response = await fetch('https://sorcer.app.n8n.cloud/webhook/f7c939d1-d7e0-48d9-bfa8-aa518bf44021', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'AuctionFlow-System/1.0'
      },
      body: JSON.stringify(webhookData),
    });

    if (response.ok) {
      const result = await response.json();
      console.log('✅ Server-side: Webhook sent successfully:', result);
      return res.status(200).json({ 
        success: true, 
        message: 'Data sent to external webhook successfully',
        response: result
      });
    } else {
      const errorText = await response.text();
      console.error('❌ Server-side: Webhook failed:', response.status, errorText);
      return res.status(response.status).json({ 
        error: `Failed to send data to webhook (Status: ${response.status})`,
        details: errorText
      });
    }
  } catch (error) {
    console.error('❌ Server-side: Error sending to webhook:', error);
    return res.status(500).json({ 
      error: 'Internal server error while sending to webhook',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
