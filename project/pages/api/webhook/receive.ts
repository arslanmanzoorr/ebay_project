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
      
      // Handle n8n's nested data structure
      let processedData: any = {};
      
      if (data.httpData && data.httpData[0] && data.httpData[0].json) {
        console.log('=== EXTRACTING FROM N8N STRUCTURE ===');
        // Extract data from n8n's nested structure
        const n8nData = data.httpData[0].json;
        console.log('n8nData:', JSON.stringify(n8nData, null, 2));
        
        processedData = {
          id: Date.now().toString(),
          url_main: n8nData.url || data.url_main || '',
          item_name: n8nData.item_name || 'Unnamed Item',
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
      
      // Import data using dataStore (auto-assigns to researcher)
      const importedItem = await dataStore.importFromWebhook(processedData);
      
      console.log('=== DATA IMPORTED TO POSTGRESQL ===');
      console.log('Imported item:', JSON.stringify(importedItem, null, 2));
      
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
      
      // Get auction items from PostgreSQL database (no separate webhook data)
      const auctionItems = await dataStore.getItems();
      
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
