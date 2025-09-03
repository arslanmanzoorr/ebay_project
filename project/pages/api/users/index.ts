import { NextApiRequest, NextApiResponse } from 'next';
import { databaseService } from '@/services/database';
import { sqliteService } from '@/services/sqliteService';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Use SQLite in development, PostgreSQL in production
  const usePostgres = process.env.NODE_ENV === 'production' && process.env.POSTGRES_HOST;
  const service = usePostgres ? databaseService : sqliteService;

  if (req.method === 'GET') {
    try {
      const users = usePostgres 
        ? await databaseService.getAllUsers()
        : await sqliteService.getAllUsers();
      res.status(200).json(users);
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({ error: 'Failed to fetch users' });
    }
  } else if (req.method === 'POST') {
    try {
      const userData = req.body;
      const newUser = usePostgres 
        ? await databaseService.createUser(userData)
        : await sqliteService.createUser(userData);
      res.status(201).json(newUser);
    } catch (error) {
      console.error('Error creating user:', error);
      res.status(500).json({ error: 'Failed to create user' });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
