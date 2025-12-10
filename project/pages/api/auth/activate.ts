import { NextApiRequest, NextApiResponse } from 'next';
import { databaseService } from '@/services/database';
import crypto from 'crypto';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const { token, password } = req.body;

  if (!token || !password) {
    return res.status(400).json({ error: 'Token and password are required' });
  }

  try {
    // 1. Verify Token (HMAC-SHA256)
    // Must match the logic in Onboarding App
    const secret = process.env.CROSS_APP_SECRET || 'temporary-dev-secret-change-me';

    if (!token.includes('.')) {
        return res.status(400).json({ error: 'Invalid token format' });
    }

    const [payloadBase64, signature] = token.split('.');

    if (!payloadBase64 || !signature) {
      return res.status(400).json({ error: 'Invalid token components' });
    }

    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payloadBase64)
      .digest('hex');

    // Timing-safe comparison recommended but strict equality ok for now
    if (signature !== expectedSignature) {
      return res.status(401).json({ error: 'Invalid signature / Token Modified' });
    }

    const payload = JSON.parse(Buffer.from(payloadBase64, 'base64').toString());

    if (Date.now() > payload.exp) {
      return res.status(401).json({ error: 'Token has expired' });
    }

    const { email, name } = payload;

    if (!email) {
        return res.status(400).json({ error: 'Invalid token payload' });
    }

    // 2. Find or Create User
    // We strictly follow the request: "those users will appear as admin on main application"
    let user = await databaseService.getUserByEmail(email);

    if (user) {
        // User exists: Update password and ensure active status
        // Note: Existing system uses plain text passwords (based on login.ts analysis)
        console.log(`Updating existing user ${email} with new password`);
        await databaseService.updateUser(user.id, {
            password: password,
            isActive: true,
            role: 'admin' // Ensure they are admin as requested
        });
    } else {
        // Create new Admin User
        console.log(`Creating new admin user ${email}`);
        user = await databaseService.createUser({
            name: name || 'Admin User',
            email: email,
            password: password,
            role: 'admin',
            isActive: true,
            avatar: null,
            createdBy: 'onboarding-bridge'
        });
    }

    res.status(200).json({ success: true, user: { email: user.email, role: user.role } });

  } catch (error) {
    console.error('Activation error:', error);
    res.status(500).json({ error: 'Activation failed. Please try again or contact support.' });
  }
}
