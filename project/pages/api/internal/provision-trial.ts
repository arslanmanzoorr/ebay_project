
import { NextApiRequest, NextApiResponse } from 'next';
import { databaseService } from '@/services/database';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const { secret, email, name, auction } = req.body;

    // 1. Validate Secret
    const expectedSecret = process.env.CROSS_APP_SECRET || 'temporary-dev-secret-change-me';
    if (secret !== expectedSecret) {
      console.warn(`[Provision] Unauthorized attempt from ${req.socket.remoteAddress}`);
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!email || !auction || !auction.url) {
        return res.status(400).json({ error: 'Missing required fields (email, auction url)' });
    }

    // 2. Find or Create User (Inactive Admin)
    let user = await databaseService.getUserByEmail(email);

    if (!user) {
        console.log(`[Provision] Creating new inactive admin user: ${email}`);
        // Create user matching the logic in activate.ts but inactive
        user = await databaseService.createUser({
            name: name || 'Trial User',
            email: email,
            password: 'temp-password-placeholder', // Will be set on activation
            role: 'admin',
            isActive: false, // Important: Inactive until they click the email link
            isTrial: true, // Mark as trial user
            // avatar: undefined, // Optional field
            createdBy: 'onboarding-provision'
        });


        // Give trial user 0 initial credits here - they get trial credits from the activation token
        // await databaseService.createUserCredits(user.id, 100);
    }

    console.log(`[Provision] User ${user.email} provisioned (or existed). Skipping item creation as per new flow.`);

    return res.status(200).json({
        success: true,
        message: 'Trial provisioned successfully',
        userId: user.id
    });

  } catch (error) {
    console.error('[Provision] Error:', error);
    return res.status(500).json({ error: 'Internal server error during provisioning' });
  }
}
