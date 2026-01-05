import { NextApiRequest, NextApiResponse } from 'next';

/**
 * External Webhook API Route
 *
 * Sends finalized auction item data to external webhook including:
 * - Original scraped data (images, descriptions, estimates)
 * - Research data (researcher estimates, notes, references)
 * - Photography data (photographer images, quantity, notes)
 * - Consolidated image data for easy access
 * - Workflow information (status, assignments, timestamps)
 * - System metadata (item ID, timestamps, version)
 *
 * The webhook payload includes ALL image URLs:
 * - originalData.images: Original scraped images
 * - originalData.mainImageUrl: Primary image from auction site
 * - photographyData.photographerImages: Images taken by photographer
 * - allImages: Consolidated view of all images with counts and primary image
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

    console.log('📤 Server-side: Sending data to external webhook:', itemData);
    console.log('📸 Photographer images being sent:', itemData.photographerImages);
    console.log('🖼️ Total images being sent:', {
      originalImages: itemData.images?.length || 0,
      photographerImages: itemData.photographerImages?.length || 0,
      mainImage: itemData.mainImageUrl ? 1 : 0
    });

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
        photographerImages: itemData.photographerImages || [],
        photographerQuantity: itemData.photographerQuantity || 1,
        photographyNotes: itemData.notes // Include any photography-specific notes
      },
      // Consolidated image data for easy access
      allImages: {
        originalImages: itemData.images || [],
        mainImage: itemData.mainImageUrl || '',
        photographerImages: itemData.photographerImages || [],
        totalImageCount: (itemData.images?.length || 0) + (itemData.photographerImages?.length || 0) + (itemData.mainImageUrl ? 1 : 0),
        primaryImage: itemData.mainImageUrl || (itemData.images && itemData.images.length > 0 ? itemData.images[0] : '') || (itemData.photographerImages && itemData.photographerImages.length > 0 ? itemData.photographerImages[0] : '')
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
        adminId: itemData.adminId,
        adminEmail: itemData.adminEmail,
        timestamp: new Date().toISOString(),
        source: 'Auction Management System',
        version: '1.0'
      }
    };

    const response = await fetch('https://sorcer.app.n8n.cloud/webhook/c4a97432-ed19-4381-b6b0-0fdd51a251e3', {
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
      console.log('📸 Photographer images successfully sent to external webhook:', itemData.photographerImages);
      return res.status(200).json({
        success: true,
        message: 'Data sent to external webhook successfully',
        response: result,
        imagesSent: {
          originalImages: itemData.images?.length || 0,
          photographerImages: itemData.photographerImages?.length || 0,
          mainImage: itemData.mainImageUrl ? 1 : 0
        }
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
