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

      // Get credit transactions
      const transactions = await databaseService.getCreditTransactions(userId);
      
      res.status(200).json({ 
        success: true,
        transactions: transactions.map(tx => ({
          id: tx.id,
          userId: tx.user_id,
          transactionType: tx.transaction_type,
          amount: tx.amount,
          description: tx.description,
          createdAt: tx.created_at
        }))
      });
    } catch (error) {
      console.error('Error getting credit transactions:', error);
      res.status(500).json({ 
        error: 'Failed to get credit transactions',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
