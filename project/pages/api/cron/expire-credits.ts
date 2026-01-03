
import { NextApiRequest, NextApiResponse } from 'next';
import { databaseService } from '@/services/database';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Check for secret to prevent unauthorized access
  const { secret } = req.query;
  if (secret !== process.env.CRON_SECRET && secret !== 'dev-cron-secret') {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const client = await databaseService.getClient();
    try {
      // 1. Find expired batches with remaining credits
      const expiredBatches = await client.query(`
        SELECT id, user_id, remaining_amount, expires_at
        FROM credit_batches
        WHERE expires_at < NOW() AND remaining_amount > 0
      `);

      if (expiredBatches.rows.length === 0) {
        return res.status(200).json({ message: 'No expired credits found to process.' });
      }

      console.log(`Found ${expiredBatches.rows.length} expired batches.`);

      // 2. Expire them (Set remaining to 0) and Log
      await client.query('BEGIN');

      for (const batch of expiredBatches.rows) {
         // Set remaining to 0
         await client.query(`
            UPDATE credit_batches
            SET remaining_amount = 0
            WHERE id = $1
         `, [batch.id]);

         // Log expiration transaction
         // We use a specific transaction type 'expiration'
         const txnId = `txn-exp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
         await client.query(`
            INSERT INTO credit_transactions (id, user_id, transaction_type, amount, description, created_at)
            VALUES ($1, $2, 'expiration', $3, $4, CURRENT_TIMESTAMP)
         `, [txnId, batch.user_id, batch.remaining_amount, `Expired credits from batch ${batch.id}`]);
      }

      await client.query('COMMIT');

      return res.status(200).json({
          success: true,
          processed: expiredBatches.rows.length,
          message: `Successfully expired credits for ${expiredBatches.rows.length} batches.`
      });

    } catch (dbError) {
      await client.query('ROLLBACK');
      throw dbError;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error running expiration job:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
