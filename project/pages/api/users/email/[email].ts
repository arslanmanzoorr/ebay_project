import { NextApiRequest, NextApiResponse } from 'next';
import { databaseService } from '@/services/database';
import { sqliteService } from '@/services/sqliteService';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { email } = req.query;
  const usePostgres = process.env.NODE_ENV === 'production' && process.env.POSTGRES_HOST;

  if (req.method === 'GET') {
    try {
      const user = usePostgres 
        ? await databaseService.getUserByEmail(email as string)
        : await sqliteService.getUserByEmail(email as string);
      if (user) {
        res.status(200).json(user);
      } else {
        res.status(404).json({ error: 'User not found' });
      }
    } catch (error) {
      console.error('Error fetching user by email:', error);
      res.status(500).json({ error: 'Failed to fetch user' });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
