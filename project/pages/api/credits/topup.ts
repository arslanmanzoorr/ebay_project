import { NextApiRequest, NextApiResponse } from 'next';
import { databaseService } from '@/services/database';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {
      const { userId, amount, description, expiresInDays } = req.body;

      // Validate input
      if (!userId || !amount || amount <= 0) {
        return res.status(400).json({
          error: 'Invalid input. userId and positive amount are required.'
        });
      }

      // Top up credits
      const success = await databaseService.topUpCredits(
        userId,
        amount,
        description || 'Credit top-up',
        expiresInDays || null
      );

      if (success) {
        // Get updated credit balance
        const credits = await databaseService.getUserCredits(userId);
        res.status(200).json({
          success: true,
          message: 'Credits topped up successfully',
          credits
        });
      } else {
        res.status(400).json({
          error: 'Failed to top up credits. User may not exist.'
        });
      }
    } catch (error) {
      console.error('Error topping up credits:', error);
      res.status(500).json({
        error: 'Failed to top up credits',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
