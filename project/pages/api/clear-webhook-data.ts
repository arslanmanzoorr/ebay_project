import type { NextApiRequest, NextApiResponse } from 'next';
import { sqliteService } from '@/services/sqliteService';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {
      // Clear all webhook data from SQLite
      await sqliteService.clearAllData();
      
      console.log('✅ All webhook data cleared from SQLite');
      
      return res.status(200).json({
        message: 'All webhook data cleared successfully',
        status: 'success'
      });
      
    } catch (error) {
      console.error('Error clearing webhook data:', error);
      return res.status(500).json({
        error: 'Failed to clear webhook data',
        details: error instanceof Error ? error.message : 'Unknown error',
        status: 'failed'
      });
    }
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}
