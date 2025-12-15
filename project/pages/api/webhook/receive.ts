import type { NextApiRequest, NextApiResponse } from 'next';
import { dataStore } from '@/services/dataStore';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {
      const data = req.body;

      console.log('=== WEBHOOK DATA RECEIVED ===');
      console.log('Full request body:', JSON.stringify(data, null, 2));
      console.log('Data type:', typeof data);
      console.log('Data keys:', Object.keys(data));
      console.log('Data structure check:', {
        isArray: Array.isArray(data),
        hasRawOutput: !!(Array.isArray(data) && data[0] && data[0].rawOutput),
        hasHttpData: !!(data.httpData && data.httpData[0] && data.httpData[0].json),
        hasDirectData: !!(data.item_name || data.url_main),
        httpDataLength: data.httpData ? data.httpData.length : 0,
        arrayLength: Array.isArray(data) ? data.length : 0
      });

      // Handle n8n's nested data structure
      let processedData: any = {};

      // Check if data is an array with rawOutput (n8n response format)
      if (Array.isArray(data) && data[0] && data[0].rawOutput) {
        console.log('=== EXTRACTING FROM N8N ARRAY FORMAT ===');
        // Parse the rawOutput JSON string
        const rawData = JSON.parse(data[0].rawOutput);
        console.log('Parsed rawOutput:', JSON.stringify(rawData, null, 2));
        console.log('Raw data keys:', Object.keys(rawData));
        console.log('Looking for item name in:', {
          item_name: rawData.item_name,
          title: rawData.title,
          name: rawData.name,
          lot_title: rawData.lot_title,
          item_title: rawData.item_title
        });

        processedData = {
          id: Date.now().toString(),
          url_main: rawData.url || rawData.url_main || '',
          item_name: rawData.item_name || rawData.title || rawData.name || rawData.lot_title || rawData.item_title || rawData.lot_name || rawData.product_name || rawData.description || 'Unnamed Item',
          lot_number: rawData.lot_number || '',
          description: rawData.description || '',
          lead: rawData.lead || '',
          category: rawData.category || '',
          estimate: rawData.estimate || '',
          auction_name: rawData.auction_name || '',
          // Extract images from the new n8n format
          all_unique_image_urls: rawData.all_unique_image_urls || '',
          main_image_url: rawData.main_image_url || '',
          gallery_image_urls: rawData.all_unique_image_urls || '',
          broad_search_images: rawData.all_unique_image_urls || '',
          tumbnail_images: rawData.tumbnail_images || '',
          ai_response: rawData.ai_response || data[0].rawOutput || '',
          received_at: new Date().toISOString(),
          status: 'processed'
        };
      } else if (Array.isArray(data) && data[0] && data[0].output) {
        console.log('=== EXTRACTING FROM N8N OUTPUT WRAPPER ===');
        const rawData = data[0].output;
        console.log('Output data keys:', Object.keys(rawData || {}));
        console.log('Looking for item name in:', {
          item_name: rawData?.item_name,
          title: rawData?.title,
          name: rawData?.name,
          lot_title: rawData?.lot_title,
          item_title: rawData?.item_title
        });

        processedData = {
          id: Date.now().toString(),
          url_main: rawData?.url || rawData?.url_main || '',
          item_name: rawData?.item_name || rawData?.title || rawData?.name || rawData?.lot_title || rawData?.item_title || rawData?.lot_name || rawData?.product_name || rawData?.description || 'Unnamed Item',
          lot_number: rawData?.lot_number || '',
          description: rawData?.description || '',
          lead: rawData?.lead || '',
          category: rawData?.category || '',
          estimate: rawData?.estimate || '',
          auction_name: rawData?.auction_name || '',
          all_unique_image_urls: rawData?.all_unique_image_urls || '',
          main_image_url: rawData?.main_image_url || '',
          gallery_image_urls: rawData?.gallery_image_urls || rawData?.all_unique_image_urls || '',
          broad_search_images: rawData?.broad_search_images || '',
          tumbnail_images: rawData?.tumbnail_images || '',
          ai_response: rawData?.ai_response || '',
          received_at: new Date().toISOString(),
          status: 'processed'
        };
      } else if (data.httpData && data.httpData[0] && data.httpData[0].json) {
        console.log('=== EXTRACTING FROM N8N STRUCTURE ===');
        // Extract data from n8n's nested structure
        const n8nData = data.httpData[0].json;
        console.log('n8nData:', JSON.stringify(n8nData, null, 2));
        console.log('n8nData keys:', Object.keys(n8nData));
        console.log('Looking for item name in:', {
          item_name: n8nData.item_name,
          title: n8nData.title,
          name: n8nData.name,
          lot_title: n8nData.lot_title,
          item_title: n8nData.item_title
        });

        processedData = {
          id: Date.now().toString(),
          url_main: n8nData.url || data.url_main || '',
          item_name: n8nData.item_name || n8nData.title || n8nData.name || n8nData.lot_title || n8nData.item_title || n8nData.lot_name || n8nData.product_name || n8nData.description || 'Unnamed Item',
          lot_number: n8nData.lot_number || '',
          description: n8nData.description || '',
          lead: n8nData.lead || '',
          category: n8nData.category || '',
          estimate: n8nData.estimate || '',
          auction_name: n8nData.auction_name || '',
          all_unique_image_urls: n8nData.all_unique_image_urls || '',
          main_image_url: n8nData.image_data?.main_image_url || '',
          gallery_image_urls: n8nData.image_data?.gallery_image_urls || '',
          broad_search_images: n8nData.image_data?.broad_search_images || '',
          tumbnail_images: n8nData.image_data?.thumbnail_urls || '',
          ai_response: data.cleanedOutput || data.rawOutput || '',
          received_at: new Date().toISOString(),
          status: 'processed'
        };
      } else {
        console.log('=== USING DIRECT DATA STRUCTURE ===');
        // Fallback to direct data structure
        processedData = {
          id: Date.now().toString(),
          url_main: data.url_main || '',
          item_name: data.item_name || 'Unnamed Item',
          lot_number: data.lot_number || '',
          description: data.description || '',
          lead: data.lead || '',
          category: data.category || '',
          estimate: data.estimate || '',
          auction_name: data.auction_name || '',
          all_unique_image_urls: data.all_unique_image_urls || '',
          main_image_url: data.main_image_url || '',
          gallery_image_urls: data.gallery_image_urls || '',
          broad_search_images: data.broad_search_images || '',
          tumbnail_images: data.tumbnail_images || '',
          ai_response: data.ai_response || data.cleanedOutput || data.rawOutput || '',
          received_at: new Date().toISOString(),
          status: 'processed'
        };
      }

      console.log('=== PROCESSED DATA ===');
      console.log('Processed data:', JSON.stringify(processedData, null, 2));

      // Extract adminId from request body
      const adminId = data.adminId;
      console.log('=== ADMIN ID EXTRACTED ===');
      console.log('Admin ID:', adminId);

      // Deduct credits for item fetch if adminId is provided
      if (adminId) {
        try {
          const { databaseService } = await import('@/services/database');
          const creditSettings = await databaseService.getCreditSettings();
          const fetchCost = creditSettings.item_fetch_cost || 1;

          const creditDeducted = await databaseService.deductCredits(
            adminId,
            fetchCost,
            `Item fetch: ${processedData.item_name || 'Unnamed Item'}`
          );

          if (!creditDeducted) {
            console.log('⚠️ Insufficient credits for item fetch');
            return res.status(400).json({
              error: 'Insufficient credits to fetch this item',
              message: 'Please contact Super Admin to top up your credits'
            });
          }

          console.log(`✅ Credits deducted: ${fetchCost} credits for item fetch`);
        } catch (error) {
          console.error('Error deducting credits:', error);
          return res.status(500).json({
            error: 'Failed to process credit deduction',
            message: 'Please try again or contact support'
          });
        }
      }

      // Import data using dataStore (auto-assigns to researcher)
      console.log('=== CALLING IMPORT FROM WEBHOOK ===');
      console.log('Processed data being sent to importFromWebhook:', JSON.stringify(processedData, null, 2));

      const importedItem = await dataStore.importFromWebhook(processedData, adminId);

      console.log('=== DATA IMPORTED TO POSTGRESQL ===');
      console.log('Imported item:', JSON.stringify(importedItem, null, 2));

      if (!importedItem) {
        console.error('❌ importFromWebhook returned null - there was an error in the import process');
      }

      return res.status(200).json({
        message: 'Webhook data received and stored successfully',
        item: importedItem,
        status: 'success',
        storage: 'postgresql'
      });

    } catch (error) {
      console.error('Error processing webhook:', error);
      return res.status(500).json({
        error: 'Failed to process webhook data',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  } else if (req.method === 'GET') {
    try {
      console.log('=== GET REQUEST RECEIVED ===');

      // Get auction items directly from database service
      const { databaseService } = await import('@/services/database');
      const auctionItems = await databaseService.getAuctionItems();

      console.log('=== AUCTION ITEMS RETRIEVED FROM POSTGRESQL ===');
      console.log('Total items:', auctionItems.length);

      // Return auction items (webhook data is now integrated into auction workflow)
      return res.status(200).json({
        message: 'Auction items retrieved successfully',
        items: auctionItems,
        total_count: auctionItems.length,
        status: 'success',
        storage: 'postgresql'
      });
    } catch (error) {
      console.error('Error retrieving auction items:', error);
      return res.status(500).json({
        error: 'Failed to retrieve auction items',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}
