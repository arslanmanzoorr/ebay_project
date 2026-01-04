const { Pool } = require('pg');

// Use local database config from .env.local
const pool = new Pool({
    host: 'localhost',
    port: 5435,
    database: 'auctionflow',
    user: 'auctionuser',
    password: 'AuctionFlow2024!'
});

async function dropForeignKeys() {
    console.log('Dropping foreign key constraints on local auction_items...');

    try {
        await pool.query(`
      ALTER TABLE auction_items
      DROP CONSTRAINT IF EXISTS auction_items_assigned_to_fkey
    `);
        console.log('✅ Dropped auction_items_assigned_to_fkey');

        await pool.query(`
      ALTER TABLE auction_items
      DROP CONSTRAINT IF EXISTS auction_items_admin_id_fkey
    `);
        console.log('✅ Dropped auction_items_admin_id_fkey');

        console.log('Done! Local DB foreign key constraints removed.');
    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await pool.end();
    }
}

dropForeignKeys();
