import { NextApiRequest, NextApiResponse } from 'next';
import { databaseService } from '@/services/database';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const { role } = req.query;
      
      if (!role || typeof role !== 'string') {
        return res.status(400).json({ 
          error: 'Role is required.' 
        });
      }

      // Get users by role
      const users = await databaseService.getUsersByRole(role);
      
      res.status(200).json({ 
        success: true,
        users: users.map(user => ({
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          isActive: user.isActive,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
          createdBy: user.createdBy
        }))
      });
    } catch (error) {
      console.error('Error getting users by role:', error);
      res.status(500).json({ 
        error: 'Failed to get users by role',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
