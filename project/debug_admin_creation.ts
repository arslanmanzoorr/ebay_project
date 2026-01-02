
import { databaseService } from './services/database';

async function debugCreateUser() {
    try {
        console.log('Attempting to create admin user...');

        // Mock data similar to what API receives
        const userData = {
            name: 'Debug Admin',
            email: 'debug_admin@bidsquire.com',
            password: 'password123',
            role: 'admin' as const,
            isActive: true
        };

        // Assuming a super admin ID exists or using a placeholder
        const createdBy = 'super-admin-001';

        const newUser = await databaseService.createUserWithCredits(userData, createdBy);
        console.log('✅ User created successfully:', newUser);

    } catch (error: any) {
        console.error('❌ Failed to create user. Error details:');
        console.error(error);
        if (error.stack) {
            console.error(error.stack);
        }
    } finally {
        await databaseService.close();
    }
}

debugCreateUser();
