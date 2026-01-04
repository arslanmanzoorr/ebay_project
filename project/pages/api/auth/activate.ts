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
              const initialCredits = typeof creditSettings.trial_credits === 'number' ? creditSettings.trial_credits : 1; // Default to at least 1
              console.log(`Applying system default ${initialCredits} trial credits to user ${email}`);
              await databaseService.createUserCredits(user.id, initialCredits);
         }
    } else {
         console.log(`User ${email} has already used a trial. Skipping credit provisioning.`);
    }

    // 3. Trigger Auto-Fetch for Provisioned Item
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
                 console.log(`[Activate] Item not found for user, creating it recursively...`);
                 const newItem = {
                    url: payload.hibid_url,
                    url_main: payload.hibid_url,
                    auctionName: payload.hibid_title || 'Recovered Trial Auction',
                    itemName: payload.hibid_title || 'Recovered Trial Item',
                    status: 'research',
                    priority: 'medium',
                    assignedTo: 'researcher',
                    notes: 'Claimed via Activation',
                    adminId: user.id
                };
                provisionedItem = await databaseService.createAuctionItem(newItem as any);
             } else {
                 console.log(`[Activate] Item ${provisionedItem.id} already exists for this user.`);
             }
        }
        // B. Fallback: Just look for any 'research' item provisioned recently (Legacy flow)
        else {
             const items = await databaseService.getAuctionItemsByAdmin(user.id);
             provisionedItem = items.find(i => i.status === 'research');
        }

        if (provisionedItem && provisionedItem.url_main) {
             console.log(`[Activate] Found/Created item ${provisionedItem.id}, triggering auto-fetch...`);

             // We only auto-fetch if we have credits (which we just provisioned if eligible)
             // Or if the user already had credits from a purchase
             const creditSettings = await databaseService.getCreditSettings();
             const itemFetchCost = creditSettings.item_fetch_cost || 1;
             const hasCredits = await databaseService.hasEnoughCredits(user.id, itemFetchCost);

             if (hasCredits) {
                 const webhookUrl = 'https://sorcer.app.n8n.cloud/webhook/789023dc-a9bf-459c-8789-d9d0c993d1cb';

                 console.log(`[Activate] Sending URL to n8n for fetching: ${provisionedItem.url_main}`);

                 // Fire and forget fetch to avoid blocking activation response
                 fetch(webhookUrl, {
                     method: 'POST',
                     headers: { 'Content-Type': 'application/json' },
                     body: JSON.stringify({
                         url_main: provisionedItem.url_main,
                         adminId: user.id
                     })
                 }).then(async (webRes) => {
                     if (webRes.ok) {
                         console.log(`[Activate] n8n webhook triggered successfully for item ${provisionedItem.id}`);
                         // Deduct credits
                         await databaseService.deductCredits(
                             user.id,
                             itemFetchCost,
                             `Auto-Fetch: ${provisionedItem.itemName || 'Provisioned Item'}`
                         );
                     } else {
                         console.error(`[Activate] n8n webhook failed: ${webRes.status}`);
                     }
                 }).catch(err => {
                     console.error('[Activate] Error triggering n8n webhook:', err);
                 });
             } else {
                 console.warn(`[Activate] Insufficient credits to auto-fetch item ${provisionedItem.id}`);
             }
        }
    } catch (fetchError) {
        console.error('[Activate] Error in auto-fetch logic:', fetchError);
        // Don't fail activation if fetch fails
    }

    res.status(200).json({ success: true, user: { email: user.email, role: user.role } });

  } catch (error) {
    console.error('Activation error:', error);
    res.status(500).json({ error: 'Activation failed. Please try again or contact support.' });
  }
}
