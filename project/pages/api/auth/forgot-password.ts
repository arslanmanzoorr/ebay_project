import { NextApiRequest, NextApiResponse } from 'next';
import { databaseService } from '@/services/database';
import { sendPasswordResetEmail } from '@/services/email';
import crypto from 'crypto';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  try {
    const user = await databaseService.getUserByEmail(email);

    if (!user) {
      // Return 200 even if user not found to prevent email enumeration
      return res.status(200).json({ success: true, message: 'If an account exists, an email has been sent.' });
    }

    // Generate token
    const token = crypto.randomBytes(32).toString('hex');
    const expires = Date.now() + 3600000; // 1 hour

    // Save token
    const saved = await databaseService.createPasswordResetToken(email, token, expires);

    if (saved) {
      // Send email
      await sendPasswordResetEmail(email, token);
    }

    return res.status(200).json({ success: true, message: 'If an account exists, an email has been sent.' });
  } catch (error) {
    console.error('Forgot password error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
