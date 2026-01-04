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
    console.log('[Activate] Decoded Payload:', JSON.stringify(payload, null, 2));

    if (Date.now() > payload.exp) {
      return res.status(401).json({ error: 'Token has expired' });
    }

    const { email, name, credits, expiresInDays } = payload;

    if (!email) {
        return res.status(400).json({ error: 'Invalid token payload' });
    }

    // 2. Find or Create User
    // We strictly follow the request: "those users will appear as admin on main application"
    let user = await databaseService.getUserByEmail(email);

    if (user) {
        // User exists: Update password and ensure active status
        console.log(`Updating existing user ${email} during activation`);
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
            isActive: true, // Mark active immediately upon activation
            avatar: undefined,
            createdBy: 'onboarding-bridge'
        });
    }

    // --- CREDIT PROVISIONING LOGIC ---
    // Strict "One Trial Per Lifetime" Rule
    // We check transaction history, not just current active status
    const hasUsedTrial = await databaseService.hasUsedTrial(user.id);

    if (!hasUsedTrial) {
         if (credits && typeof credits === 'number' && credits > 0) {
              console.log(`Applying ${credits} trial credits to user ${email} (First time trial)`);
              await databaseService.topUpCredits(user.id, credits, 'Provisioned via Activation', expiresInDays || null);
         } else {
              // Internal fallback if token doesn't have credits but they are eligible
              const creditSettings = await databaseService.getCreditSettings();
              const initialCredits = typeof creditSettings.trial_credits === 'number' ? creditSettings.trial_credits : 3; // Default to 3 as requested
              console.log(`Applying system default ${initialCredits} trial credits to user ${email}`);
              await databaseService.createUserCredits(user.id, initialCredits);
         }
    } else {
         console.log(`User ${email} has already used a trial. Skipping credit provisioning.`);
    }

    // 3. Create Item Stub (Lock user to URL) but DO NOT Auto-Fetch
    try {
        let provisionedItem;

        // A. Priority: Look for the specific item from the token (Hibid URL)
        // This ensures that even existing users who claim a NEW auction/county get correctly linked
        if (payload.hibid_url) {
             console.log(`[Activate] Token contains Hibid URL: ${payload.hibid_url}`);
             const items = await databaseService.getAuctionItemsByAdmin(user.id);

             // Check if this specific item already exists for this user
             provisionedItem = items.find(i => i.url_main === payload.hibid_url);

             if (!provisionedItem) {
                 console.log(`[Activate] Creating item stub for user...`);
                 const newItem = {
                    url: payload.hibid_url,
                    url_main: payload.hibid_url,
                    auctionName: payload.hibid_title || 'Claimed Auction',
                    itemName: payload.hibid_title || 'Claimed Item',
                    status: 'research', // Standard status, will appear in dashboard
                    priority: 'medium',
                    assignedTo: 'researcher',
                    notes: 'Claimed via Activation - Pending Processing',
                    adminId: user.id
                };
                provisionedItem = await databaseService.createAuctionItem(newItem as any);
             } else {
                 console.log(`[Activate] Item ${provisionedItem.id} already exists for this user.`);
             }
        }

        if (provisionedItem && provisionedItem.url_main) {
             console.log(`[Activate] Item ${provisionedItem.id} stub created/found. Auto-fetch disabled per configuration.`);
        }

    } catch (err: any) {
        console.error('Error in item provisioning logic:', err);
        // Don't fail activation if item creation fails
    }

    return res.status(200).json({
        user: { email: user.email, role: user.role },
        success: true
    });
  } catch (error) {
    console.error('Activation error:', error);
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}
