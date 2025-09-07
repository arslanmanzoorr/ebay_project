import { NextApiRequest, NextApiResponse } from 'next';
import { databaseService } from '@/services/database';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const items = await databaseService.getAuctionItems();
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
  } else if (req.method === 'PUT') {
    try {
      const { id } = req.query;
      if (!id || typeof id !== 'string') {
        return res.status(400).json({ error: 'Item ID is required' });
      }
      
      const updates = req.body;
      const updatedItem = await databaseService.updateAuctionItem(id, updates);
      if (updatedItem) {
        res.status(200).json(updatedItem);
      } else {
        res.status(404).json({ error: 'Item not found' });
      }
    } catch (error) {
      console.error('Error updating auction item:', error);
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
