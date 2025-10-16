import { NextApiRequest, NextApiResponse } from 'next';
import { databaseService } from '@/services/database';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const { adminId } = req.query;
      
      if (!adminId || typeof adminId !== 'string') {
        return res.status(400).json({ 
          error: 'Admin ID is required.' 
        });
      }

      // Get photographers created by specific admin
      const photographers = await databaseService.getPhotographersByAdmin(adminId);
      
      res.status(200).json({ 
        success: true,
        photographers: photographers.map(user => ({
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
      console.error('Error getting photographers by admin:', error);
      res.status(500).json({ 
        error: 'Failed to get photographers by admin',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
