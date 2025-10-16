import { NextApiRequest, NextApiResponse } from 'next';
import { databaseService } from '@/services/database';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const { userId } = req.query;
      
      if (!userId || typeof userId !== 'string') {
        return res.status(400).json({ 
          error: 'User ID is required.' 
        });
      }

      // Get user credits
      const credits = await databaseService.getUserCredits(userId);
      
      if (credits) {
        const isLowBalance = credits.current_credits <= 10;
        res.status(200).json({ 
          success: true,
          credits: {
            currentCredits: credits.current_credits,
            totalPurchased: credits.total_purchased,
            isLowBalance
          }
        });
      } else {
        res.status(404).json({ 
          error: 'User credits not found' 
        });
      }
    } catch (error) {
      console.error('Error getting credit balance:', error);
      res.status(500).json({ 
        error: 'Failed to get credit balance',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
