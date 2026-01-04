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

      // Extract adminId and itemId from request body
      // Handle various n8n data structures (flat object or array)
      let adminId = data.adminId;
      let itemId = data.itemId;

      if (Array.isArray(data) && data[0]) {
        // Check inside the first element of the array
        if (!itemId) itemId = data[0].itemId || data[0].id; // Check 'id' as well
        if (!itemId && data[0].json) itemId = data[0].json.itemId || data[0].json.id;
        if (!itemId && data[0].body) itemId = data[0].body.itemId || data[0].body.id;

        if (!adminId) adminId = data[0].adminId || data[0].admin_id;
        if (!adminId && data[0].json) adminId = data[0].json.adminId || data[0].json.admin_id;
        if (!adminId && data[0].body) adminId = data[0].body.adminId || data[0].body.admin_id;
      }

      // Also check if they were passed inside the raw output/processed data
      if (!itemId && processedData.itemId) itemId = processedData.itemId;
      if (!itemId && processedData.item_id) itemId = processedData.item_id;
      if (!itemId && processedData.id) itemId = processedData.id; // Check processedData.id too

      console.log('=== ADMIN/ITEM ID EXTRACTION RESULT ===');
      console.log('Final Admin ID:', adminId);
      console.log('Final Item ID:', itemId);
      console.log('Extraction Source:', {
        fromRoot: !!data.itemId,
        fromArray: Array.isArray(data) && !!(data[0]?.itemId || data[0]?.json?.itemId),
        fromProcessed: !!(processedData.itemId || processedData.item_id)
      });

      // Import database service for direct update
      const { databaseService } = await import('@/services/database');

      let resultItem;

      // If itemId is provided, this is an update to an existing placeholder
      if (itemId) {
        console.log('=== UPDATING EXISTING PLACEHOLDER ITEM ===');
        console.log('Item ID to update:', itemId);

        // Update the placeholder with actual data
        const updateData = {
          url: processedData.url_main || undefined,
          itemName: processedData.item_name || 'Unnamed Item',
          lotNumber: processedData.lot_number || undefined,
          description: processedData.description || undefined,
          lead: processedData.lead || undefined,
          category: processedData.category || 'Uncategorized',
          auctionSiteEstimate: processedData.estimate || undefined,
          auctionName: processedData.auction_name || undefined,
          mainImageUrl: processedData.main_image_url || undefined,
          images: processedData.all_unique_image_urls ? processedData.all_unique_image_urls.split(',').filter(Boolean) : [],
          aiDescription: processedData.ai_response || undefined,
          status: 'research' as const, // Move from 'processing' to 'research'
          assignedTo: 'researcher',
          adminId: adminId || undefined,
        };

        resultItem = await databaseService.updateAuctionItem(itemId, updateData);
        if (resultItem) {
           console.log('=== PLACEHOLDER UPDATED BY ID ===');
        } else {
           console.log('=== UPDATE BY ID FAILED - ITEM NOT FOUND ===');
        }
      }

      // If update by ID failed or no ID provided, try Fuzzy URL Match if we have adminId
      if (!resultItem && adminId) {
         console.log('=== ATTEMPTING FUZZY URL MATCH ===');
         const urlToMatch = processedData.url_main;
         if (urlToMatch) {
            const fuzzyMatch = await databaseService.findProcessingItemByFuzzyUrl(urlToMatch, adminId);
            if (fuzzyMatch) {
               console.log(`=== FOUND FUZZY MATCH: ${fuzzyMatch.id} ===`);
               // Update this item
               const updateData = {
                url: processedData.url_main || undefined,
                itemName: processedData.item_name || 'Unnamed Item',
                lotNumber: processedData.lot_number || undefined,
                description: processedData.description || undefined,
                lead: processedData.lead || undefined,
                category: processedData.category || 'Uncategorized',
                auctionSiteEstimate: processedData.estimate || undefined,
                auctionName: processedData.auction_name || undefined,
                mainImageUrl: processedData.main_image_url || undefined,
                images: processedData.all_unique_image_urls ? processedData.all_unique_image_urls.split(',').filter(Boolean) : [],
                aiDescription: processedData.ai_response || undefined,
                status: 'research' as const,
                assignedTo: 'researcher',
                adminId: adminId, // Ensure admin match
               };
               resultItem = await databaseService.updateAuctionItem(fuzzyMatch.id, updateData);
            } else {
              console.log('=== NO FUZZY MATCH FOUND ===');
            }
         }
      }

      // Fallback: If still no result, create new item (legacy behavior)
      if (!resultItem) {
        // Fallback: No itemId/Match means this might be from an old request or direct n8n call
        // Use the old import method
        console.log('=== NO MATCH FOUND - USING LEGACY IMPORT (CREATING NEW) ===');
        resultItem = await dataStore.importFromWebhook(processedData, adminId);
      }

      console.log('=== DATA SAVED TO POSTGRESQL ===');
      console.log('Result item:', JSON.stringify(resultItem, null, 2));

      if (!resultItem) {
        console.error('❌ Save operation returned null - there was an error');
      }

      return res.status(200).json({
        message: itemId ? 'Placeholder item updated successfully' : 'Webhook data received and stored successfully',
        item: resultItem,
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
