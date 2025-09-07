import { NextApiRequest, NextApiResponse } from 'next';

/**
 * Researcher Progression Webhook API Route
 * 
 * Sends item data to 3rd N8N webhook when researcher moves item to "winning" status.
 * This webhook receives data including all researcher additions and modifications.
 * 
 * Triggered automatically when:
 * - Researcher moves item from "research" → "winning" status
 * - Includes all researcher data (estimates, notes, references, similar URLs)
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { itemData } = req.body;

    if (!itemData) {
      return res.status(400).json({ error: 'Item data is required' });
    }

    console.log('📤 Researcher Progression: Sending data to 3rd N8N webhook:', itemData);
    console.log('🔬 Researcher data being sent:', {
      researcherEstimate: itemData.researcherEstimate,
      researcherDescription: itemData.researcherDescription,
      referenceUrls: itemData.referenceUrls?.length || 0,
      similarUrls: itemData.similarUrls?.length || 0,
      notes: itemData.notes
    });

    // Prepare comprehensive data package for researcher progression
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
      // Research data (what researcher added/modified)
      researchData: {
        researcherEstimate: itemData.researcherEstimate,
        researcherDescription: itemData.researcherDescription,
        referenceUrls: itemData.referenceUrls || [],
        similarUrls: itemData.similarUrls || [],
        priority: itemData.priority,
        notes: itemData.notes,
        researcherName: itemData.assignedTo // Will be resolved to name in dataStore
      },
      // Consolidated image data
      allImages: {
        originalImages: itemData.images || [],
        mainImage: itemData.mainImageUrl || '',
        totalImageCount: (itemData.images?.length || 0) + (itemData.mainImageUrl ? 1 : 0),
        primaryImage: itemData.mainImageUrl || (itemData.images && itemData.images.length > 0 ? itemData.images[0] : '')
      },
      // Workflow information
      workflowInfo: {
        status: itemData.status,
        previousStatus: 'research',
        assignedTo: itemData.assignedTo,
        createdAt: itemData.createdAt,
        updatedAt: itemData.updatedAt,
        tags: itemData.tags
      },
      // System metadata
      metadata: {
        itemId: itemData.id,
        timestamp: new Date().toISOString(),
        source: 'Auction Management System - Researcher Progression',
        version: '1.0',
        trigger: 'researcher_to_winning'
      }
    };

    // Send to 3rd N8N webhook
    const response = await fetch('https://sorcer.app.n8n.cloud/webhook/773545cd-c409-4548-a36d-ea47af40bed0', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'AuctionFlow-System/1.0'
      }
    });

    if (response.ok) {
      const result = await response.json();
      console.log('✅ Researcher Progression: Webhook sent successfully:', result);
      return res.status(200).json({ 
        success: true, 
        message: 'Researcher progression data sent to 3rd N8N webhook successfully',
        response: result,
        dataSent: {
          originalImages: itemData.images?.length || 0,
          researcherEstimate: itemData.researcherEstimate,
          referenceUrls: itemData.referenceUrls?.length || 0,
          similarUrls: itemData.similarUrls?.length || 0
        }
      });
    } else {
      const errorText = await response.text();
      console.error('❌ Researcher Progression: Webhook failed:', response.status, errorText);
      return res.status(response.status).json({ 
        error: `Failed to send researcher progression data to 3rd N8N webhook (Status: ${response.status})`,
        details: errorText
      });
    }
  } catch (error) {
    console.error('❌ Researcher Progression: Error sending to webhook:', error);
    return res.status(500).json({ 
      error: 'Internal server error while sending researcher progression data',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
