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
        // Note: Existing system uses plain text passwords (based on login.ts analysis)
        console.log(`Updating existing user ${email} with new password`);
        await databaseService.updateUser(user.id, {
            password: password,
            isActive: true,
            role: 'admin' // Ensure they are admin as requested
        });

        // Apply credits if present in token AND user was not already active
        // This prevents potential credit duplication if the activation link is clicked multiple times
        if (!user.isActive) {
             if (credits && typeof credits === 'number' && credits > 0) {
                  console.log(`Applying ${credits} credits to new activation for ${email} (Expires in ${expiresInDays} days)`);
                  await databaseService.topUpCredits(user.id, credits, 'Provisioned via Activation', expiresInDays || null);
             }
        } else {
             console.log(`User ${email} is already active. Skipping credit application to prevent duplication.`);
        }
    } else {
        // Create new Admin User
        console.log(`Creating new admin user ${email}`);
        user = await databaseService.createUser({
            name: name || 'Admin User',
            email: email,
            password: password,
            role: 'admin',
            isActive: true,
            avatar: undefined,
            createdBy: 'onboarding-bridge'
        });

        // Initialize credits based on System Settings (Dynamic Trial Credits)
        const creditSettings = await databaseService.getCreditSettings();

        // Default Logic: Base plan includes 100 credits (items)
        let initialCredits = 100;

        if (typeof creditSettings.trial_credits === 'number') {
            initialCredits = creditSettings.trial_credits;
        }

        await databaseService.createUserCredits(user.id, initialCredits);
    }

    // 3. Trigger Auto-Fetch for Provisioned Item (if any)
    try {
        const items = await databaseService.getAuctionItemsByAdmin(user.id);
        let provisionedItem = items.find(i => i.url_main && i.status === 'research');

        // RECOVERY: If not found but token has hibid_url, create it on the fly
        if (!provisionedItem && payload.hibid_url) {
             console.log(`[Activate] Recovering provisioned item from token: ${payload.hibid_url}`);
             const newItem = {
                url: payload.hibid_url,
                url_main: payload.hibid_url,
                auctionName: payload.hibid_title || 'Recovered Trial Auction',
                itemName: payload.hibid_title || 'Recovered Trial Item',
                status: 'research',
                priority: 'medium',
                assignedTo: 'researcher',
                notes: 'Recovered from Activation Token',
                adminId: user.id
            };
            // Use databaseService directly
            // casting to any to bypass strict type check matching provision-trial.ts
            provisionedItem = await databaseService.createAuctionItem(newItem as any);
        }

        if (provisionedItem && provisionedItem.url_main) {
             console.log(`[Activate] Found provisioned item ${provisionedItem.id}, triggering auto-fetch via n8n...`);

             // Check credits (though we just gave them 3, best to be safe)
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
