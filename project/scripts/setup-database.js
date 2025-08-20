#!/usr/bin/env node

const { Pool } = require('pg');

// Database configuration - update these values
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'ebay_project',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
};

async function setupDatabase() {
  console.log('🚀 Setting up PostgreSQL database...');
  console.log('Configuration:', { ...dbConfig, password: '***' });

  const pool = new Pool(dbConfig);

  try {
    // Test connection
    console.log('📡 Testing database connection...');
    const client = await pool.connect();
    await client.query('SELECT NOW()');
    console.log('✅ Database connection successful!');
    client.release();

    // Create database if it doesn't exist
    console.log('🗄️ Creating database if it doesn\'t exist...');
    const adminPool = new Pool({
      ...dbConfig,
      database: 'postgres' // Connect to default postgres database
    });

    try {
      await adminPool.query(`CREATE DATABASE "${dbConfig.database}"`);
      console.log(`✅ Database "${dbConfig.database}" created successfully!`);
    } catch (error) {
      if (error.code === '42P04') {
        console.log(`ℹ️ Database "${dbConfig.database}" already exists`);
      } else {
        throw error;
      }
    } finally {
      await adminPool.end();
    }

    // Create tables
    console.log('📋 Creating database tables...');
    const tableClient = await pool.connect();

    // Create users table
    await tableClient.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        is_active BOOLEAN DEFAULT true
      )
    `);

    // Create auction_items table
    await tableClient.query(`
      CREATE TABLE IF NOT EXISTS auction_items (
        id VARCHAR(255) PRIMARY KEY,
        url TEXT,
        auction_name VARCHAR(255),
        lot_number VARCHAR(100),
        images TEXT[],
        sku VARCHAR(100),
        item_name VARCHAR(255),
        category VARCHAR(100),
        description TEXT,
        lead TEXT,
        auction_site_estimate VARCHAR(100),
        ai_description TEXT,
        ai_estimate VARCHAR(100),
        status VARCHAR(50) NOT NULL,
        researcher_estimate VARCHAR(100),
        researcher_description TEXT,
        reference_urls TEXT[],
        photographer_quantity INTEGER,
        photographer_images TEXT[],
        final_data JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        assigned_to VARCHAR(255),
        notes TEXT,
        priority VARCHAR(20),
        tags TEXT[]
      )
    `);

    // Create workflow_steps table
    await tableClient.query(`
      CREATE TABLE IF NOT EXISTS workflow_steps (
        id VARCHAR(255) PRIMARY KEY,
        item_id VARCHAR(255) NOT NULL,
        from_status VARCHAR(50) NOT NULL,
        to_status VARCHAR(50) NOT NULL,
        user_id VARCHAR(255) NOT NULL,
        user_name VARCHAR(255) NOT NULL,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        notes TEXT,
        data JSONB,
        FOREIGN KEY (item_id) REFERENCES auction_items(id) ON DELETE CASCADE
      )
    `);

    // Create notifications table
    await tableClient.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        type VARCHAR(50) NOT NULL,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        read BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        item_id VARCHAR(255),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (item_id) REFERENCES auction_items(id) ON DELETE CASCADE
      )
    `);

    // Create webhook_data table
    await tableClient.query(`
      CREATE TABLE IF NOT EXISTS webhook_data (
        id VARCHAR(255) PRIMARY KEY,
        url_main TEXT NOT NULL,
        item_name VARCHAR(255),
        lot_number VARCHAR(100),
        description TEXT,
        lead TEXT,
        category VARCHAR(100),
        estimate VARCHAR(100),
        auction_name VARCHAR(255),
        all_unique_image_urls TEXT[],
        main_image_url TEXT,
        gallery_image_urls TEXT[],
        broad_search_images TEXT[],
        tumbnail_images TEXT[],
        ai_response TEXT,
        received_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        status VARCHAR(50) DEFAULT 'processed'
      )
    `);

    tableClient.release();
    console.log('✅ All tables created successfully!');

    // Create admin user
    console.log('👤 Creating admin user...');
    const adminClient = await pool.connect();
    
    try {
      const adminExists = await adminClient.query('SELECT id FROM users WHERE role = $1', ['admin']);
      if (adminExists.rows.length === 0) {
        await adminClient.query(`
          INSERT INTO users (id, name, email, password, role, is_active)
          VALUES ($1, $2, $3, $4, $5, $6)
        `, [
          'admin-001',
          'Admin User',
          'admin@example.com',
          'admin123',
          'admin',
          true
        ]);
        console.log('✅ Admin user created successfully!');
        console.log('📧 Email: admin@example.com');
        console.log('🔑 Password: admin123');
      } else {
        console.log('ℹ️ Admin user already exists');
      }
    } finally {
      adminClient.release();
    }

    console.log('\n🎉 Database setup completed successfully!');
    console.log('\n📝 Next steps:');
    console.log('1. Copy env.local.template to .env.local');
    console.log('2. Update database credentials in .env.local');
    console.log('3. Start your Next.js application');
    console.log('4. Login with admin@example.com / admin123');

  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Make sure PostgreSQL is running');
    console.log('2. Check your database credentials');
    console.log('3. Ensure the postgres user has permission to create databases');
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run setup if this file is executed directly
if (require.main === module) {
  setupDatabase().catch(console.error);
}

module.exports = { setupDatabase };
