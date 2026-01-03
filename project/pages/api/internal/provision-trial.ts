
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

        // Give trial user 100 credits
        await databaseService.createUserCredits(user.id, 100);
    }

    // 3. Create Auction Item (Bypassing Credit Check)
    // We map the incoming auction data to the AuctionItem schema

    // Auto-assign to 'researcher' role as per standard flow
    // Note: In dataStore.ts, autoAssignRole('research') returns 'researcher'
    const assignedRole = 'researcher';

    const newItem = {
        url: auction.url,
        url_main: auction.url,
        auctionName: auction.title || 'Trial Auction',
        itemName: auction.title || 'Trial Item',
        // Default fields
        status: 'research',
        priority: 'medium',
        assignedTo: assignedRole, // Auto-assign

        // Optional fields from scraper if available
        itemCount: auction.itemCount, // Not standard schema but useful potentially

        // Metadata to track source
        notes: `Provisioned via Trial Claim. Original Item Count: ${auction.itemCount}`,
        adminId: user.id // Associate with this user
    };

    // Use databaseService directly to avoid any side-effects or checks in dataStore layers
    // casting to any to bypass strict type check on Omit<> for quick implementation matching database.ts signature
    const createdItem = await databaseService.createAuctionItem(newItem as any);

    console.log(`[Provision] Successfully provisioned trial item ${createdItem.id} for user ${email}`);

    return res.status(200).json({
        success: true,
        message: 'Trial provisioned successfully',
        userId: user.id,
        itemId: createdItem.id
    });

  } catch (error) {
    console.error('[Provision] Error:', error);
    return res.status(500).json({ error: 'Internal server error during provisioning' });
  }
}
