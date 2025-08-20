import type { NextApiRequest, NextApiResponse } from 'next';
import { sqliteService } from '@/services/sqliteService';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      // Test SQLite connection
      const isConnected = sqliteService.isConnected();
      
      if (!isConnected) {
        return res.status(500).json({
          error: 'SQLite not connected',
          status: 'failed'
        });
      }

      // Try to get some data
      const items = await sqliteService.getWebhookData();
      
      return res.status(200).json({
        message: 'SQLite is working correctly!',
        status: 'success',
        connected: true,
        itemCount: items.length,
        items: items.slice(0, 3) // Show first 3 items as sample
      });
      
    } catch (error) {
      console.error('SQLite test error:', error);
      return res.status(500).json({
        error: 'SQLite test failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        status: 'failed'
      });
    }
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}
