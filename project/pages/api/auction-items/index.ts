import { NextApiRequest, NextApiResponse } from 'next';
import { databaseService } from '@/services/database';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const { userId, userRole } = req.query;

      let items;
      if (userRole === 'admin' && userId) {
        // For admin users, only return items they created/fetched
        items = await databaseService.getAuctionItemsByAdmin(userId as string);
      } else if (userRole === 'photographer' && userId) {
        // For photographers, return items created by their admin
        const user = await databaseService.getUserById(userId as string);
        if (user && user.createdBy) {
          items = await databaseService.getAuctionItemsByAdmin(user.createdBy);
        } else {
          // If no creator found, return empty list (or all items if that's safer, but strict is better)
          items = [];
        }
      } else {
        // For other users (researchers), return all items
        items = await databaseService.getAuctionItems();
      }

      res.status(200).json(items);
    } catch (error) {
      console.error('Error fetching auction items:', error);
      res.status(500).json({ error: 'Failed to fetch auction items' });
    }
  } else if (req.method === 'POST') {
    try {
      const itemData = req.body;
      const adminId = itemData.adminId as string | undefined;

      if (adminId) {
        try {
          const creditSettings = await databaseService.getCreditSettings();
          const fetchCost = creditSettings.item_fetch_cost ?? 1;
          const itemName =
            itemData.itemName ||
            itemData.item_name ||
            itemData.url_main ||
            itemData.url ||
            'Auction Item';

          const creditDeducted = await databaseService.deductCredits(
            adminId,
            fetchCost,
            `Item fetch: ${itemName}`
          );

          if (!creditDeducted) {
            return res.status(400).json({
              error: 'Insufficient credits to create item'
            });
          }
        } catch (creditError) {
          console.error('Error deducting credits for item creation:', creditError);
          return res.status(500).json({
            error: 'Failed to deduct credits for item creation'
          });
        }
      }

      const newItem = await databaseService.createAuctionItem(itemData);
      res.status(201).json(newItem);
    } catch (error) {
      console.error('Error creating auction item:', error);
      res.status(500).json({ error: 'Failed to create auction item' });
    }
  } else if (req.method === 'PUT') {
    try {
      const { id } = req.query;
      if (!id || typeof id !== 'string') {
        return res.status(400).json({ error: 'Item ID is required' });
      }

       const updates = req.body;
       console.log('🔄 API PUT /api/auction-items called:', { id, updates });

       // Check specific status transitions for credit deduction
       if (updates.status) {
         const currentItem = await databaseService.getAuctionItem(id);

         // Research 2 -> Admin Review (or generic 'research2' completion)
         // The requirement: "when credits for a user falls below research 2 cost, that user can't do research 2 tasks"
         // This implies entering the next stage requires payment.
         // Typically status goes: research -> winning -> photography -> research2 -> admin_review -> finalized
         if (currentItem && currentItem.status === 'research2' && updates.status !== 'research2') {
             const adminId = currentItem.adminId;
             if (adminId) {
                 const creditSettings = await databaseService.getCreditSettings();
                 const research2Cost = creditSettings.research2_cost || 2; // Default to 2 as requested

                 const hasCredits = await databaseService.hasEnoughCredits(adminId, research2Cost);
                 if (!hasCredits) {
                     return res.status(403).json({
                         error: `Insufficient credits for Research 2 task. Required: ${research2Cost}`,
                         code: 'INSUFFICIENT_CREDITS',
                         required: research2Cost
                     });
                 }

                 // Deduct credits
                 await databaseService.deductCredits(
                     adminId,
                     research2Cost,
                     `Research 2 completion: ${currentItem.itemName || 'Unnamed Item'}`
                 );
             }
         }
       }

      const updatedItem = await databaseService.updateAuctionItem(id, updates);
      console.log('📥 Database update result:', updatedItem);

      if (updatedItem) {
        res.status(200).json(updatedItem);
      } else {
        res.status(404).json({ error: 'Item not found' });
      }
    } catch (error) {
      console.error('❌ Error updating auction item:', error);
      res.status(500).json({ error: 'Failed to update auction item' });
    }
  } else if (req.method === 'DELETE') {
    try {
      const { id } = req.query;
      if (!id || typeof id !== 'string') {
        return res.status(400).json({ error: 'Item ID is required' });
      }

      const success = await databaseService.deleteAuctionItem(id);
      if (success) {
        res.status(200).json({ message: 'Item deleted successfully' });
      } else {
        res.status(404).json({ error: 'Item not found' });
      }
    } catch (error) {
      console.error('Error deleting auction item:', error);
      res.status(500).json({ error: 'Failed to delete auction item' });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
