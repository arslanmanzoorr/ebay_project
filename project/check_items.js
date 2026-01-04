require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function check() {
    const result = await pool.query(`
    SELECT id, item_name, status, url, admin_id
    FROM auction_items
    ORDER BY created_at DESC
    LIMIT 10
  `);
    console.log('Recent items:');
    result.rows.forEach((r, i) => {
        console.log(`${i + 1}. [${r.status}] ${r.item_name} (admin: ${r.admin_id})`);
        console.log(`   URL: ${r.url?.substring(0, 60)}...`);
    });
    await pool.end();
}
check();
