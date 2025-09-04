import { NextApiRequest, NextApiResponse } from 'next';
import { databaseService } from '@/services/database';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('🔍 API Route called:', req.method);
  console.log('🔍 Database connected:', databaseService.isDatabaseConnected());
  
  if (req.method === 'GET') {
    try {
      console.log('📋 Fetching users...');
      const users = await databaseService.getAllUsers();
      console.log('📋 Users fetched:', users.length);
      res.status(200).json(users);
    } catch (error) {
      console.error('❌ Error fetching users:', error);
      res.status(500).json({ error: 'Failed to fetch users', details: error.message });
    }
  } else if (req.method === 'POST') {
    try {
      console.log('👤 Creating user with data:', req.body);
      const userData = req.body;
      const newUser = await databaseService.createUser(userData);
      console.log('✅ User created:', newUser);
      res.status(201).json(newUser);
    } catch (error) {
      console.error('❌ Error creating user:', error);
      res.status(500).json({ error: 'Failed to create user', details: error.message });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
