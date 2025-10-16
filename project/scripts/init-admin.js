#!/usr/bin/env node

/**
 * Production Admin User Initialization Script
 * Run this script to create an admin user in production
 * 
 * Usage:
 * node scripts/init-admin.js
 * 
 * Environment Variables:
 * - ADMIN_NAME: Admin user's display name
 * - ADMIN_EMAIL: Admin user's email
 * - ADMIN_PASSWORD: Admin user's password
 * - DATABASE_URL: PostgreSQL connection string
 */

const { Pool } = require('pg');

// Database configuration - Hardcoded for server deployment
const dbConfig = {
  host: 'postgres', // Use container name for Docker networking
  port: 5432,
  database: 'auctionflow',
  user: 'auctionuser',
  password: 'auctionpass',
  ssl: false, // Disable SSL for development
};

// Admin user configuration
const adminConfig = {
  name: process.env.ADMIN_NAME || 'Bidsquire Admin',
  email: process.env.ADMIN_EMAIL || 'admin@bidsquire.com',
  password: process.env.ADMIN_PASSWORD || 'Admin@bids25',
};

async function createAdminUser() {
  const pool = new Pool(dbConfig);
  
  try {
    console.log('🔌 Connecting to database...');
    const client = await pool.connect();
    
    // Check if admin user already exists
    const existingAdmin = await client.query(
      'SELECT id FROM users WHERE email = $1',
      [adminConfig.email]
    );
    
    if (existingAdmin.rows.length > 0) {
      console.log('⚠️  Admin user already exists:', adminConfig.email);
      console.log('   To update the admin user, delete the existing one first.');
      return;
    }
    
    // Create admin user
    const adminId = `admin-${Date.now()}`;
    const now = new Date();
    
    const result = await client.query(`
      INSERT INTO users (id, name, email, password, role, "createdAt", "updatedAt", "isActive")
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id, name, email, role
    `, [
      adminId,
      adminConfig.name,
      adminConfig.email,
      adminConfig.password,
      'admin',
      now,
      now,
      true
    ]);
    
    console.log('✅ Admin user created successfully!');
    console.log('📋 Admin Details:');
    console.log('   ID:', result.rows[0].id);
    console.log('   Name:', result.rows[0].name);
    console.log('   Email:', result.rows[0].email);
    console.log('   Role:', result.rows[0].role);
    console.log('');
    console.log('🔐 Login Credentials:');
    console.log('   Email:', adminConfig.email);
    console.log('   Password:', adminConfig.password);
    console.log('');
    console.log('⚠️  IMPORTANT: Change the admin password after first login!');
    
  } catch (error) {
    console.error('❌ Error creating admin user:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run the script
createAdminUser();
