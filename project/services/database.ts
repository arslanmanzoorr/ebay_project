// This file is server-side only and should not be imported on the client side
// It will be used only in API routes and server-side functions

import { Pool, PoolClient } from 'pg';
import { AuctionItem, UserAccount, WorkflowStep, Notification } from '@/types/auction';

// Check if we're in a browser environment
const isBrowser = typeof window !== 'undefined';

// Database configuration
const dbConfig = {
  host: process.env.POSTGRES_HOST || process.env.NEXT_PUBLIC_DB_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || process.env.NEXT_PUBLIC_DB_PORT || '5432'),
  database: process.env.POSTGRES_DB || process.env.NEXT_PUBLIC_DB_NAME || 'auctionflow',
  user: process.env.POSTGRES_USER || process.env.NEXT_PUBLIC_DB_USER || 'auctionuser',
  password: process.env.POSTGRES_PASSWORD || process.env.NEXT_PUBLIC_DB_PASSWORD || 'auctionpass123',
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
          "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          "isActive" BOOLEAN DEFAULT TRUE
        )
      `);

      // Create auction_items table
      await client.query(`
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
          is_multiple_items BOOLEAN DEFAULT FALSE,
          multiple_items_count INTEGER DEFAULT 1,
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
        INSERT INTO users (id, name, email, password, role, "createdAt", "updatedAt", "isActive")
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
      const result = await client.query('SELECT * FROM users ORDER BY "createdAt" DESC');
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
      const result = await client.query('SELECT * FROM users WHERE email = $1', [email]);
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
          id, url, auction_name, lot_number, images, main_image_url, sku, item_name, category, description,
          lead, auction_site_estimate, ai_description, ai_estimate, status, researcher_estimate,
          researcher_description, reference_urls, similar_urls, photographer_quantity, photographer_images,
          is_multiple_items, multiple_items_count, final_data, created_at, updated_at, assigned_to, notes, priority, tags
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30
        ) RETURNING *
      `, [
        id, item.url, item.auctionName, item.lotNumber, item.images, item.mainImageUrl, item.sku, item.itemName,
        item.category, item.description, item.lead, item.auctionSiteEstimate, item.aiDescription,
        item.aiEstimate, item.status, item.researcherEstimate, item.researcherDescription,
        item.referenceUrls, item.similarUrls, item.photographerQuantity, item.photographerImages,
        item.isMultipleItems || false, item.multipleItemsCount || 1, item.finalData,
        now, now, item.assignedTo, item.notes, item.priority, item.tags
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
      avatar: row.avatar
    };
  }

  private mapAuctionItemFromDb(row: any): AuctionItem {
    return {
      id: row.id,
      url: row.url,
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
      priority: row.priority as any,
      tags: row.tags || []
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
}

// Export the database service
export const databaseService = new DatabaseService();
