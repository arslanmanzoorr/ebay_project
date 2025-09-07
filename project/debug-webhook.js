const { Pool } = require('pg');

async function testDatabase() {
  const pool = new Pool({
    host: 'localhost',
    port: 5432,
    database: 'auctionflow',
    user: 'auctionuser',
    password: 'auctionpass123',
    ssl: false
  });

  try {
    console.log('Testing database connection...');
    const client = await pool.connect();
    
    console.log('Testing simple query...');
    const result = await client.query('SELECT COUNT(*) FROM users');
    console.log('Users count:', result.rows[0].count);
    
    console.log('Testing auction_items table...');
    const itemsResult = await client.query('SELECT COUNT(*) FROM auction_items');
    console.log('Auction items count:', itemsResult.rows[0].count);
    
    console.log('Testing INSERT into auction_items...');
    const insertResult = await client.query(`
      INSERT INTO auction_items (
        id, url, auction_name, lot_number, images, main_image_url, sku, item_name, category, description,
        lead, auction_site_estimate, ai_description, ai_estimate, status, researcher_estimate,
        researcher_description, reference_urls, similar_urls, photographer_quantity, photographer_images,
        is_multiple_items, multiple_items_count, final_data, created_at, updated_at, assigned_to, notes, priority, tags
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30
      ) RETURNING *
    `, [
      'test-123', 'https://test.com', 'Test Auction', '123', [], '', 'Test Item', 'Test Category', 'Test Description',
      '', '$100', 'AI Description', '$100', 'research', '', '', [], [], null, [], false, 1, null,
      new Date(), new Date(), '1757009210670', '', 'medium', []
    ]);
    
    console.log('✅ Insert successful:', insertResult.rows[0].id);
    
    client.release();
  } catch (error) {
    console.error('❌ Database error:', error);
  } finally {
    await pool.end();
  }
}

testDatabase();
