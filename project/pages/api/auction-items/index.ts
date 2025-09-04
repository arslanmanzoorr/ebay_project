import { NextApiRequest, NextApiResponse } from 'next';
import { databaseService } from '@/services/database';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const items = await databaseService.getAllAuctionItems();
      res.status(200).json(items);
    } catch (error) {
      console.error('Error fetching auction items:', error);
      res.status(500).json({ error: 'Failed to fetch auction items' });
    }
  } else if (req.method === 'POST') {
    try {
      const itemData = req.body;
      const newItem = await databaseService.createAuctionItem(itemData);
      res.status(201).json(newItem);
    } catch (error) {
      console.error('Error creating auction item:', error);
      res.status(500).json({ error: 'Failed to create auction item' });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
