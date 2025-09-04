import { NextApiRequest, NextApiResponse } from 'next';
import { dataStore } from '@/services/dataStore';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('🔄 System reset requested...');

    // Clear all application data (users, items, workflow, notifications)
    dataStore.clearAllData();
    console.log('✅ Application data cleared');

    // Reinitialize admin user
    dataStore.initializeAdminUser();
    console.log('✅ Admin user reinitialized');

    return res.status(200).json({ 
      success: true, 
      message: 'System reset complete. All data cleared and admin user restored.',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error during system reset:', error);
    return res.status(500).json({ 
      error: 'Failed to reset system',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
