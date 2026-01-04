require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function dropForeignKeys() {
    console.log('Dropping foreign key constraints on auction_items...');

    try {
        // Drop assigned_to foreign key constraint
        await pool.query(`
      ALTER TABLE auction_items
      DROP CONSTRAINT IF EXISTS auction_items_assigned_to_fkey
    `);
        console.log('✅ Dropped auction_items_assigned_to_fkey');

        // Drop admin_id foreign key constraint
        await pool.query(`
      ALTER TABLE auction_items
      DROP CONSTRAINT IF EXISTS auction_items_admin_id_fkey
    `);
        console.log('✅ Dropped auction_items_admin_id_fkey');

        console.log('Done! Foreign key constraints removed.');
    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await pool.end();
    }
}

dropForeignKeys();
