
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function backup() {
    const models = [
        'user',
        'auctionItem',
        'workflowStep',
        'notification',
        'webhookData',
        'userCredit',
        'creditTransaction',
        'creditSetting'
    ];

    const backupDir = path.join(__dirname, 'db_backup');
    if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir);
    }

    console.log('Starting backup...');

    for (const model of models) {
        try {
            console.log(`Backing up ${model}...`);
            // @ts-ignore
            const data = await prisma[model].findMany();
            fs.writeFileSync(
                path.join(backupDir, `${model}.json`),
                JSON.stringify(data, null, 2)
            );
            console.log(`Saved ${data.length} records for ${model}`);
        } catch (error) {
            console.error(`Error backing up ${model}:`, error);
        }
    }

    console.log('Backup completed successfully.');
}

backup()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
