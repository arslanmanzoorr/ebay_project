import { NextApiRequest, NextApiResponse } from 'next';
import { databaseService } from '@/services/database';
import { sqliteService } from '@/services/sqliteService';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  const usePostgres = process.env.NODE_ENV === 'production' && process.env.POSTGRES_HOST;

  if (req.method === 'GET') {
    try {
      const user = usePostgres 
        ? await databaseService.getUserById(id as string)
        : await sqliteService.getUserById(id as string);
      if (user) {
        res.status(200).json(user);
      } else {
        res.status(404).json({ error: 'User not found' });
      }
    } catch (error) {
      console.error('Error fetching user:', error);
      res.status(500).json({ error: 'Failed to fetch user' });
    }
  } else if (req.method === 'PUT') {
    try {
      const updates = req.body;
      const updatedUser = usePostgres 
        ? await databaseService.updateUser(id as string, updates)
        : await sqliteService.updateUser(id as string, updates);
      if (updatedUser) {
        res.status(200).json(updatedUser);
      } else {
        res.status(404).json({ error: 'User not found' });
      }
    } catch (error) {
      console.error('Error updating user:', error);
      res.status(500).json({ error: 'Failed to update user' });
    }
  } else if (req.method === 'DELETE') {
    try {
      const success = usePostgres 
        ? await databaseService.deleteUser(id as string)
        : await sqliteService.deleteUser(id as string);
      if (success) {
        res.status(200).json({ message: 'User deleted successfully' });
      } else {
        res.status(404).json({ error: 'User not found' });
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      res.status(500).json({ error: 'Failed to delete user' });
    }
  } else {
    res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
