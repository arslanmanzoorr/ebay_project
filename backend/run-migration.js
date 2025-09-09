const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Database configuration
const dbConfig = {
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  database: process.env.POSTGRES_DB || 'auctionflow',
  user: process.env.POSTGRES_USER || 'auctionuser',
  password: process.env.POSTGRES_PASSWORD || 'auctionpass123',
  ssl: false,
};

async function runMigration() {
  const pool = new Pool(dbConfig);
  const client = await pool.connect();
  
  try {
    console.log('🔄 Running database migration...');
    
    // Read migration file
    const migrationPath = path.join(__dirname, 'api', 'migrations', '0002_add_subitem_fields.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Execute migration
    await client.query(migrationSQL);
    
    console.log('✅ Migration completed successfully!');
    
    // Verify the changes
    const result = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'auction_items' 
      AND column_name IN ('parent_item_id', 'sub_item_number', 'priority')
      ORDER BY column_name
    `);
    
    console.log('📋 New columns in auction_items table:');
    result.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable}, default: ${row.column_default})`);
    });
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration();
