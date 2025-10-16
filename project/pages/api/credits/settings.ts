import { NextApiRequest, NextApiResponse } from 'next';
import { databaseService } from '@/services/database';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      // Get credit settings
      const settings = await databaseService.getCreditSettings();
      
      res.status(200).json({ 
        success: true,
        settings 
      });
    } catch (error) {
      console.error('Error getting credit settings:', error);
      res.status(500).json({ 
        error: 'Failed to get credit settings',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  } else if (req.method === 'PUT') {
    try {
      const { settings, updatedBy } = req.body;
      
      // Validate input
      if (!settings || !updatedBy) {
        return res.status(400).json({ 
          error: 'Settings and updatedBy are required.' 
        });
      }

      // Update credit settings
      const success = await databaseService.updateCreditSettings(settings, updatedBy);
      
      if (success) {
        res.status(200).json({ 
          success: true,
          message: 'Credit settings updated successfully',
          settings 
        });
      } else {
        res.status(400).json({ 
          error: 'Failed to update credit settings' 
        });
      }
    } catch (error) {
      console.error('Error updating credit settings:', error);
      res.status(500).json({ 
        error: 'Failed to update credit settings',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  } else {
    res.setHeader('Allow', ['GET', 'PUT']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
