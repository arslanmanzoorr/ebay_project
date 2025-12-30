import { NextApiRequest, NextApiResponse } from 'next';
import { databaseService } from '@/services/database';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    return res.status(400).json({ error: 'Token and new password are required' });
  }

  try {
    // Validate token
    const tokenData = await databaseService.validatePasswordResetToken(token);

    if (!tokenData) {
      return res.status(400).json({ error: 'Invalid or expired token' });
    }

    const { user_email } = tokenData;

    // Get user
    const user = await databaseService.getUserByEmail(user_email);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Update password
    await databaseService.updateUser(user.id, {
      password: newPassword
    });

    // Delete used token
    await databaseService.deletePasswordResetToken(token);

    return res.status(200).json({ success: true, message: 'Password reset successfully' });

  } catch (error) {
    console.error('Reset password error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
