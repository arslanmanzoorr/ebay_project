
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
    user: 'auctionuser',
    host: 'localhost',
    database: 'auctionflow',
    password: 'auctionpass',
    port: 5432,
});

async function backup() {
    const backupDir = path.join(__dirname, 'db_backup_pg');
    if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir);
    }

    // List of tables from schema.prisma mapped to DB table names
    const tables = [
        'users',
        'auction_items',
        'workflow_steps',
        'notifications',
        'webhook_data',
        'user_credits',
        'credit_transactions',
        'credit_settings',
        '_prisma_migrations'
    ];

    console.log('Starting backup with pg driver...');

    for (const table of tables) {
        try {
            console.log(`Backing up table ${table}...`);
            const res = await pool.query(`SELECT * FROM "${table}"`);
            fs.writeFileSync(
                path.join(backupDir, `${table}.json`),
                JSON.stringify(res.rows, null, 2)
            );
            console.log(`Saved ${res.rowCount} rows from ${table}`);
        } catch (error) {
            // Ignore irrelevant tables if they don't exist
            if (error.code === '42P01') {
                console.log(`Table ${table} does not exist, skipping.`);
            } else {
                console.error(`Error backing up ${table}:`, error.message);
            }
        }
    }

    console.log('Backup finished.');
}

backup()
    .then(() => process.exit(0))
    .catch(e => {
        console.error(e);
        process.exit(1);
    });
