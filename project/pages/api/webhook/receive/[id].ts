import type { NextApiRequest, NextApiResponse } from 'next';
import { sqliteService } from '@/services/sqliteService';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (req.method === 'DELETE') {
    try {
      if (!id || typeof id !== 'string') {
        return res.status(400).json({
          error: 'Invalid item ID',
          status: 'failed'
        });
      }

      // Delete the webhook item from SQLite
      await sqliteService.deleteWebhookItem(id);
      
      console.log(`✅ Webhook item deleted: ${id}`);
      
      return res.status(200).json({
        message: 'Webhook item deleted successfully',
        status: 'success'
      });
      
    } catch (error) {
      console.error('Error deleting webhook item:', error);
      return res.status(500).json({
        error: 'Failed to delete webhook item',
        details: error instanceof Error ? error.message : 'Unknown error',
        status: 'failed'
      });
    }
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}
