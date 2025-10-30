// This file is server-side only and should not be imported on the client side
// It will be used only in API routes and server-side functions

import { Pool, PoolClient } from 'pg';
import { AuctionItem, UserAccount, WorkflowStep, Notification } from '@/types/auction';

// Check if we're in a browser environment
const isBrowser = typeof window !== 'undefined';

// Database configuration - Hardcoded for server deployment
const dbConfig = {
  host: 'postgres', // Use container name for Docker networking
  port: 5432,
  database: 'auctionflow',
  user: 'auctionuser',
  password: 'auctionpass',
  ssl: false, // Disable SSL for development
};

class DatabaseService {
  private pool: Pool | null = null;
  private isConnected = false;
  private initializationPromise: Promise<void> | null = null;

  constructor() {
    // Only initialize on server side
    if (!isBrowser) {
      this.initializationPromise = this.initializeDatabase();
    }
  }

  // Ensure database is initialized before any operation
  private async ensureInitialized(): Promise<void> {
    if (this.initializationPromise) {
      await this.initializationPromise;
    }
  }

  private async initializeDatabase() {
    try {
      console.log('🔌 Initializing database connection with config:', {
        host: dbConfig.host,
        port: dbConfig.port,
        database: dbConfig.database,
        user: dbConfig.user,
        ssl: dbConfig.ssl
      });
      
      // Create connection pool
      this.pool = new Pool(dbConfig);
      
      // Test connection
      const client = await this.pool.connect();
      await client.query('SELECT NOW()');
      client.release();
      
      this.isConnected = true;
      console.log('✅ Database connected successfully');
      
      // Initialize tables
      await this.createTables();
    } catch (error) {
      console.error('❌ Database connection failed:', error);
      console.error('❌ Database config:', dbConfig);
      this.isConnected = false;
    }
  }

  private async createTables() {
    if (!this.pool) return;

    try {
      const client = await this.pool.connect();
      
      // Create users table (matching initialization script)
      await client.query(`
        CREATE TABLE IF NOT EXISTS users (
          id VARCHAR(255) PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          email VARCHAR(255) UNIQUE NOT NULL,
          password VARCHAR(255) NOT NULL,
          role VARCHAR(50) NOT NULL DEFAULT 'user',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          is_active BOOLEAN DEFAULT TRUE
        )
      `);

      // Create auction_items table
      await client.query(`
        CREATE TABLE IF NOT EXISTS auction_items (
          id VARCHAR(255) PRIMARY KEY,
          url TEXT,
          url_main TEXT,
          auction_name VARCHAR(255),
          lot_number VARCHAR(100),
          images TEXT[],
          main_image_url TEXT,
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
          similar_urls TEXT[],
          photographer_quantity INTEGER,
          photographer_images TEXT[],
          is_multiple_items BOOLEAN DEFAULT FALSE,
          multiple_items_count INTEGER DEFAULT 1,
          final_data JSONB,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          assigned_to VARCHAR(255),
          notes TEXT,
          photographer_notes TEXT,
          researcher_notes TEXT,
          researcher2_notes TEXT,
          priority VARCHAR(20) DEFAULT 'medium',
          tags TEXT[],
          parent_item_id VARCHAR(255),
          sub_item_number INTEGER,
          admin_id VARCHAR(255),
          FOREIGN KEY (parent_item_id) REFERENCES auction_items(id) ON DELETE CASCADE,
          FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE SET NULL
        )
      `);

      // Create workflow_steps table
      await client.query(`
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
      await client.query(`
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
      await client.query(`
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

      // Create user_credits table
      await client.query(`
        CREATE TABLE IF NOT EXISTS user_credits (
          id VARCHAR(255) PRIMARY KEY,
          user_id VARCHAR(255) NOT NULL,
          current_credits INTEGER DEFAULT 60,
          total_purchased INTEGER DEFAULT 60,
          last_topup_date TIMESTAMP,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
      `);

      // Create credit_transactions table
      await client.query(`
        CREATE TABLE IF NOT EXISTS credit_transactions (
          id VARCHAR(255) PRIMARY KEY,
          user_id VARCHAR(255) NOT NULL,
          transaction_type VARCHAR(50) NOT NULL,
          amount INTEGER NOT NULL,
          description TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
      `);

      // Create credit_settings table
      await client.query(`
        CREATE TABLE IF NOT EXISTS credit_settings (
          id VARCHAR(255) PRIMARY KEY,
          setting_name VARCHAR(100) UNIQUE NOT NULL,
          setting_value INTEGER NOT NULL,
          description TEXT,
          updated_by VARCHAR(255),
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
        )
      `);

      // Add created_by field to users table
      await client.query(`
        ALTER TABLE users ADD COLUMN IF NOT EXISTS created_by VARCHAR(255)
      `);

      // Create indexes for new tables
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_user_credits_user_id ON user_credits(user_id)
      `);
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_id ON credit_transactions(user_id)
      `);
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_credit_transactions_type ON credit_transactions(transaction_type)
      `);
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_credit_settings_name ON credit_settings(setting_name)
      `);
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_users_created_by ON users(created_by)
      `);

      client.release();
      console.log('✅ Database tables created successfully');
    } catch (error) {
      console.error('❌ Error creating tables:', error);
    }
  }

  // Check if database is connected
  isDatabaseConnected(): boolean {
    if (isBrowser) return false;
    return this.isConnected;
  }

  // Get database connection
  private async getClient(): Promise<PoolClient> {
    if (isBrowser) {
      throw new Error('Database service not available on client side');
    }
    if (!this.pool) {
      throw new Error('Database not initialized');
    }
    return await this.pool.connect();
  }

  // Users operations
  async createUser(user: Omit<UserAccount, 'id' | 'createdAt' | 'updatedAt'>): Promise<UserAccount> {
    if (isBrowser) {
      throw new Error('Database service not available on client side');
    }
    
    // Ensure database is initialized
    await this.ensureInitialized();
    
    if (!this.isConnected) {
      throw new Error('Database not connected');
    }
    
    const client = await this.getClient();
    try {
      const id = Date.now().toString();
      const now = new Date();
      
      console.log('👤 Creating user:', { name: user.name, email: user.email, role: user.role });
      
      const result = await client.query(`
        INSERT INTO users (id, name, email, password, role, created_at, updated_at, is_active)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
      `, [id, user.name, user.email, user.password, user.role, now, now, user.isActive]);
      
      console.log('✅ User created successfully:', result.rows[0]);
      return this.mapUserFromDb(result.rows[0]);
    } catch (error) {
      console.error('❌ Error creating user:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  async getAllUsers(): Promise<UserAccount[]> {
    if (isBrowser) {
      throw new Error('Database service not available on client side');
    }
    
    // Ensure database is initialized
    await this.ensureInitialized();
    
    const client = await this.getClient();
    try {
      const result = await client.query('SELECT * FROM users ORDER BY created_at DESC');
      return result.rows.map(row => this.mapUserFromDb(row));
    } finally {
      client.release();
    }
  }

  async getUserById(id: string): Promise<UserAccount | null> {
    if (isBrowser) {
      throw new Error('Database service not available on client side');
    }
    
    const client = await this.getClient();
    try {
      const result = await client.query('SELECT * FROM users WHERE id = $1', [id]);
      return result.rows.length > 0 ? this.mapUserFromDb(result.rows[0]) : null;
    } finally {
      client.release();
    }
  }

  async getUserByEmail(email: string): Promise<UserAccount | null> {
    if (isBrowser) {
      throw new Error('Database service not available on client side');
    }
    
    const client = await this.getClient();
    try {
      // Use LOWER() for case-insensitive email comparison
      const result = await client.query('SELECT * FROM users WHERE LOWER(email) = LOWER($1)', [email]);
      return result.rows.length > 0 ? this.mapUserFromDb(result.rows[0]) : null;
    } finally {
      client.release();
    }
  }

  async deleteUser(id: string): Promise<boolean> {
    if (isBrowser) {
      throw new Error('Database service not available on client side');
    }
    
    const client = await this.getClient();
    try {
      const result = await client.query('DELETE FROM users WHERE id = $1', [id]);
      return (result.rowCount ?? 0) > 0;
    } finally {
      client.release();
    }
  }

  async updateUser(id: string, updates: Partial<UserAccount>): Promise<UserAccount | null> {
    if (isBrowser) {
      throw new Error('Database service not available on client side');
    }
    
    const client = await this.getClient();
    try {
      const fields = Object.keys(updates).filter(key => key !== 'id' && key !== 'role');
      const values = fields.map((_, index) => `$${index + 2}`);
      
      const query = `
        UPDATE users 
        SET ${fields.map(field => `${this.camelToSnake(field)} = $${fields.indexOf(field) + 2}`).join(', ')}, updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING *
      `;
      
      const result = await client.query(query, [id, ...fields.map(field => updates[field as keyof UserAccount])]);
      return result.rows.length > 0 ? this.mapUserFromDb(result.rows[0]) : null;
    } finally {
      client.release();
    }
  }

  async changePassword(id: string, currentPassword: string, newPassword: string): Promise<boolean> {
    if (isBrowser) {
      throw new Error('Database service not available on client side');
    }
    
    const client = await this.getClient();
    try {
      const result = await client.query(
        'UPDATE users SET password = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND password = $3',
        [newPassword, id, currentPassword]
      );
      return (result.rowCount ?? 0) > 0;
    } finally {
      client.release();
    }
  }

  // Auction items operations
  async createAuctionItem(item: Omit<AuctionItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<AuctionItem> {
    if (isBrowser) {
      throw new Error('Database service not available on client side');
    }
    
    const client = await this.getClient();
    try {
      const id = Date.now().toString();
      const now = new Date();
      
      const result = await client.query(`
        INSERT INTO auction_items (
          id, url, url_main, auction_name, lot_number, images, main_image_url, sku, item_name, category, description,
          lead, auction_site_estimate, ai_description, ai_estimate, status, researcher_estimate,
          researcher_description, reference_urls, similar_urls, photographer_quantity, photographer_images,
          is_multiple_items, multiple_items_count, final_data, created_at, updated_at, assigned_to, notes, priority, tags,
          parent_item_id, sub_item_number, photographer_notes, researcher_notes, researcher2_notes, admin_id
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33, $34, $35, $36, $37
        ) RETURNING *
      `, [
        id, item.url, item.url_main || null, item.auctionName, item.lotNumber, item.images, item.mainImageUrl, item.sku, item.itemName,
        item.category, item.description, item.lead, item.auctionSiteEstimate, item.aiDescription,
        item.aiEstimate, item.status, item.researcherEstimate, item.researcherDescription,
        item.referenceUrls, item.similarUrls, item.photographerQuantity, item.photographerImages,
        item.isMultipleItems || false, item.multipleItemsCount || 1, item.finalData,
        now, now, item.assignedTo, item.notes, item.priority || 'medium', item.tags, item.parentItemId || null, item.subItemNumber || null, item.photographerNotes || null, item.researcherNotes || null, item.researcher2Notes || null, item.adminId || null
      ]);
      
      return this.mapAuctionItemFromDb(result.rows[0]);
    } finally {
      client.release();
    }
  }

  async getAuctionItems(): Promise<AuctionItem[]> {
    if (isBrowser) {
      throw new Error('Database service not available on client side');
    }
    
    console.log('🔍 Database: Getting auction items...');
    const client = await this.getClient();
    try {
      const result = await client.query('SELECT * FROM auction_items ORDER BY created_at DESC');
      console.log('📊 Database: Found', result.rows.length, 'items');
      const items = result.rows.map(row => this.mapAuctionItemFromDb(row));
      console.log('📋 Database: Mapped items:', items.length);
      return items;
    } finally {
      client.release();
    }
  }

  async getAuctionItemsByAdmin(adminId: string): Promise<AuctionItem[]> {
    if (isBrowser) {
      throw new Error('Database service not available on client side');
    }
    
    console.log('🔍 Database: Getting auction items for admin:', adminId);
    const client = await this.getClient();
    try {
      const result = await client.query('SELECT * FROM auction_items WHERE admin_id = $1 ORDER BY created_at DESC', [adminId]);
      console.log('📊 Database: Found', result.rows.length, 'items for admin');
      const items = result.rows.map(row => this.mapAuctionItemFromDb(row));
      console.log('📋 Database: Mapped items:', items.length);
      return items;
    } finally {
      client.release();
    }
  }

  async updateAuctionItem(id: string, updates: Partial<AuctionItem>): Promise<AuctionItem | null> {
    if (isBrowser) {
      throw new Error('Database service not available on client side');
    }
    
    console.log('🔄 Database updateAuctionItem called:', { id, updates });
    
    const client = await this.getClient();
    try {
      const fields = Object.keys(updates).filter(key => key !== 'id');
      const values = fields.map((_, index) => `$${index + 2}`);
      
      const query = `
        UPDATE auction_items 
        SET ${fields.map(field => `${this.camelToSnake(field)} = $${fields.indexOf(field) + 2}`).join(', ')}, updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING *
      `;
      
      console.log('📤 Database query:', query);
      console.log('📤 Database values:', [id, ...fields.map(field => updates[field as keyof AuctionItem])]);
      
      const result = await client.query(query, [id, ...fields.map(field => updates[field as keyof AuctionItem])]);
      console.log('📥 Database result:', result.rows[0]);
      
      return result.rows.length > 0 ? this.mapAuctionItemFromDb(result.rows[0]) : null;
    } finally {
      client.release();
    }
  }

  // Webhook data operations
  async storeWebhookData(data: any): Promise<any> {
    if (isBrowser) {
      throw new Error('Database service not available on client side');
    }
    
    const client = await this.getClient();
    try {
      const id = Date.now().toString();
      
      const result = await client.query(`
        INSERT INTO webhook_data (
          id, url_main, item_name, lot_number, description, lead, category, estimate,
          auction_name, all_unique_image_urls, main_image_url, gallery_image_urls,
          broad_search_images, tumbnail_images, ai_response, status
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16
        ) RETURNING *
      `, [
        id, data.url_main, data.item_name, data.lot_number, data.description, data.lead,
        data.category, data.estimate, data.auction_name, data.all_unique_image_urls,
        data.main_image_url, data.gallery_image_urls, data.broad_search_images,
        data.tumbnail_images, data.ai_response, 'processed'
      ]);
      
      return result.rows[0];
    } finally {
      client.release();
    }
  }

  async getWebhookData(): Promise<any[]> {
    if (isBrowser) {
      throw new Error('Database service not available on client side');
    }
    
    const client = await this.getClient();
    try {
      const result = await client.query('SELECT * FROM webhook_data ORDER BY received_at DESC');
      return result.rows;
    } finally {
      client.release();
    }
  }

  // Helper methods
  private camelToSnake(str: string): string {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
  }

  private mapUserFromDb(row: any): UserAccount {
    return {
      id: row.id,
      name: row.name,
      email: row.email,
      password: row.password,
      role: row.role as any,
      createdAt: new Date(row.createdAt || row.created_at),
      updatedAt: new Date(row.updatedAt || row.updated_at),
      isActive: Boolean(row.isActive || row.is_active),
      avatar: row.avatar,
      createdBy: row.created_by
    };
  }

  private mapAuctionItemFromDb(row: any): AuctionItem {
    return {
      id: row.id,
      url: row.url,
      url_main: row.url_main,
      auctionName: row.auction_name,
      lotNumber: row.lot_number,
      images: Array.isArray(row.images) ? row.images : (row.images ? [row.images] : []),
      mainImageUrl: row.main_image_url,
      sku: row.sku,
      itemName: row.item_name,
      category: row.category,
      description: row.description,
      lead: row.lead,
      auctionSiteEstimate: row.auction_site_estimate,
      aiDescription: row.ai_description,
      aiEstimate: row.ai_estimate,
      status: row.status as any,
      researcherEstimate: row.researcher_estimate,
      researcherDescription: row.researcher_description,
      referenceUrls: Array.isArray(row.reference_urls) ? row.reference_urls : (row.reference_urls ? [row.reference_urls] : []),
      similarUrls: Array.isArray(row.similar_urls) ? row.similar_urls : (row.similar_urls ? [row.similar_urls] : []),
      photographerQuantity: row.photographer_quantity,
      photographerImages: Array.isArray(row.photographer_images) ? row.photographer_images : (row.photographer_images ? [row.photographer_images] : []),
      isMultipleItems: Boolean(row.is_multiple_items),
      multipleItemsCount: row.multiple_items_count || 1,
      finalData: row.final_data,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      assignedTo: row.assigned_to,
      notes: row.notes,
      photographerNotes: row.photographer_notes,
      researcherNotes: row.researcher_notes,
      researcher2Notes: row.researcher2_notes,
      priority: row.priority as any,
      tags: row.tags || [],
      parentItemId: row.parent_item_id,
      subItemNumber: row.sub_item_number,
      adminId: row.admin_id
    };
  }

  // Close database connection
  async close() {
    if (this.pool && !isBrowser) {
      await this.pool.end();
      this.isConnected = false;
    }
  }

  async deleteAuctionItem(id: string): Promise<boolean> {
    if (isBrowser) {
      throw new Error('Database service not available on client side');
    }
    
    const client = await this.getClient();
    try {
      const result = await client.query('DELETE FROM auction_items WHERE id = $1', [id]);
      return (result.rowCount ?? 0) > 0;
    } finally {
      client.release();
    }
  }

  // Credit Management Methods
  async createUserCredits(userId: string, initialCredits: number = 60): Promise<boolean> {
    if (isBrowser) {
      throw new Error('Database service not available on client side');
    }
    
    const client = await this.getClient();
    try {
      const id = `credits-${userId}`;
      await client.query(`
        INSERT INTO user_credits (id, user_id, current_credits, total_purchased, created_at, updated_at)
        VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        ON CONFLICT (id) DO NOTHING
      `, [id, userId, initialCredits, initialCredits]);
      
      // Log initial credit transaction
      await this.addCreditTransaction(userId, 'purchase', initialCredits, 'Initial credits');
      return true;
    } finally {
      client.release();
    }
  }

  async getUserCredits(userId: string): Promise<{ current_credits: number; total_purchased: number } | null> {
    if (isBrowser) {
      throw new Error('Database service not available on client side');
    }
    
    const client = await this.getClient();
    try {
      const result = await client.query(
        'SELECT current_credits, total_purchased FROM user_credits WHERE user_id = $1',
        [userId]
      );
      return result.rows.length > 0 ? result.rows[0] : null;
    } finally {
      client.release();
    }
  }

  async deductCredits(userId: string, amount: number, description: string): Promise<boolean> {
    if (isBrowser) {
      throw new Error('Database service not available on client side');
    }
    
    const client = await this.getClient();
    try {
      // Check if user has enough credits
      const credits = await this.getUserCredits(userId);
      if (!credits || credits.current_credits < amount) {
        return false;
      }

      // Deduct credits
      const result = await client.query(`
        UPDATE user_credits 
        SET current_credits = current_credits - $1, updated_at = CURRENT_TIMESTAMP
        WHERE user_id = $2 AND current_credits >= $1
      `, [amount, userId]);

      if ((result.rowCount ?? 0) > 0) {
        // Log transaction
        await this.addCreditTransaction(userId, 'deduction', amount, description);
        return true;
      }
      return false;
    } finally {
      client.release();
    }
  }

  async topUpCredits(userId: string, amount: number, description: string = 'Credit top-up'): Promise<boolean> {
    if (isBrowser) {
      throw new Error('Database service not available on client side');
    }
    
    const client = await this.getClient();
    try {
      const result = await client.query(`
        UPDATE user_credits 
        SET current_credits = current_credits + $1, 
            total_purchased = total_purchased + $1,
            last_topup_date = CURRENT_TIMESTAMP,
            updated_at = CURRENT_TIMESTAMP
        WHERE user_id = $2
      `, [amount, userId]);

      if ((result.rowCount ?? 0) > 0) {
        // Log transaction
        await this.addCreditTransaction(userId, 'topup', amount, description);
        return true;
      }
      return false;
    } finally {
      client.release();
    }
  }

  async addCreditTransaction(userId: string, type: string, amount: number, description: string): Promise<void> {
    if (isBrowser) {
      throw new Error('Database service not available on client side');
    }
    
    const client = await this.getClient();
    try {
      const id = `txn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      await client.query(`
        INSERT INTO credit_transactions (id, user_id, transaction_type, amount, description, created_at)
        VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
      `, [id, userId, type, amount, description]);
    } finally {
      client.release();
    }
  }

  async getCreditTransactions(userId: string): Promise<any[]> {
    if (isBrowser) {
      throw new Error('Database service not available on client side');
    }
    
    const client = await this.getClient();
    try {
      const result = await client.query(`
        SELECT * FROM credit_transactions 
        WHERE user_id = $1 
        ORDER BY created_at DESC
      `, [userId]);
      return result.rows;
    } finally {
      client.release();
    }
  }

  async getCreditSettings(): Promise<{ [key: string]: number }> {
    if (isBrowser) {
      throw new Error('Database service not available on client side');
    }
    
    const client = await this.getClient();
    try {
      const result = await client.query('SELECT setting_name, setting_value FROM credit_settings');
      const settings: { [key: string]: number } = {};
      result.rows.forEach(row => {
        settings[row.setting_name] = row.setting_value;
      });
      return settings;
    } finally {
      client.release();
    }
  }

  async updateCreditSettings(settings: { [key: string]: number }, updatedBy: string): Promise<boolean> {
    if (isBrowser) {
      throw new Error('Database service not available on client side');
    }
    
    const client = await this.getClient();
    try {
      for (const [settingName, value] of Object.entries(settings)) {
        await client.query(`
          UPDATE credit_settings 
          SET setting_value = $1, updated_by = $2, updated_at = CURRENT_TIMESTAMP
          WHERE setting_name = $3
        `, [value, updatedBy, settingName]);
      }
      return true;
    } finally {
      client.release();
    }
  }

  async getUsersByRole(role: string): Promise<UserAccount[]> {
    if (isBrowser) {
      throw new Error('Database service not available on client side');
    }
    
    const client = await this.getClient();
    try {
      const result = await client.query(
        'SELECT * FROM users WHERE role = $1 ORDER BY created_at DESC',
        [role]
      );
      return result.rows.map(row => this.mapUserFromDb(row));
    } finally {
      client.release();
    }
  }

  async getPhotographersByAdmin(adminId: string): Promise<UserAccount[]> {
    if (isBrowser) {
      throw new Error('Database service not available on client side');
    }
    
    const client = await this.getClient();
    try {
      const result = await client.query(`
        SELECT * FROM users 
        WHERE role = 'photographer' AND created_by = $1 
        ORDER BY created_at DESC
      `, [adminId]);
      return result.rows.map(row => this.mapUserFromDb(row));
    } finally {
      client.release();
    }
  }

  async createUserWithCredits(userData: Omit<UserAccount, 'id' | 'createdAt' | 'updatedAt'>, createdBy: string): Promise<UserAccount> {
    if (isBrowser) {
      throw new Error('Database service not available on client side');
    }
    
    const client = await this.getClient();
    try {
      const id = `user-${Date.now()}`;
      const now = new Date();
      const isActive = userData.isActive !== false;
      
      // Create user
      const result = await client.query(`
        INSERT INTO users (id, name, email, password, role, created_at, updated_at, is_active, created_by)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *
      `, [
        id, userData.name, userData.email, userData.password, userData.role,
        now, now, isActive, createdBy
      ]);
      
      const newUser = this.mapUserFromDb(result.rows[0]);
      
      // Create credits for admin users
      if (userData.role === 'admin') {
        await this.createUserCredits(id, 60);
      }
      
      return newUser;
    } finally {
      client.release();
    }
  }
}

// Export the database service
export const databaseService = new DatabaseService();
