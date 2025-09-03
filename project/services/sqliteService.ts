import sqlite3 from 'sqlite3';
import path from 'path';

export class SQLiteService {
  private db: sqlite3.Database;
  private dbPath: string;

  constructor() {
    // Create database in the project root
    this.dbPath = path.join(process.cwd(), 'webhook_data.db');
    console.log('🔍 SQLite database path:', this.dbPath);
    console.log('🔍 Current working directory:', process.cwd());
    
    // Ensure the database file has proper permissions
    this.db = new sqlite3.Database(this.dbPath, (err) => {
      if (err) {
        console.error('❌ Error opening SQLite database:', err);
        console.error('❌ Database path:', this.dbPath);
      } else {
        console.log('✅ SQLite database opened successfully at:', this.dbPath);
      }
    });
    this.initializeDatabase();
  }

  private initializeDatabase(): void {
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS webhook_items (
        id TEXT PRIMARY KEY,
        url_main TEXT,
        item_name TEXT,
        lot_number TEXT,
        description TEXT,
        lead TEXT,
        category TEXT,
        estimate TEXT,
        auction_name TEXT,
        all_unique_image_urls TEXT,
        main_image_url TEXT,
        gallery_image_urls TEXT,
        broad_search_images TEXT,
        tumbnail_images TEXT,
        ai_response TEXT,
        received_at TEXT,
        status TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `;

    this.db.run(createTableSQL, (err) => {
      if (err) {
        console.error('❌ Error creating table:', err);
        console.error('❌ Table creation SQL:', createTableSQL);
      } else {
        console.log('✅ SQLite database table created successfully');
      }
    });
  }

  async storeWebhookData(data: any): Promise<any> {
    return new Promise((resolve, reject) => {
      const insertSQL = `
        INSERT OR REPLACE INTO webhook_items (
          id, url_main, item_name, lot_number, description, lead, 
          category, estimate, auction_name, all_unique_image_urls, 
          main_image_url, gallery_image_urls, broad_search_images, 
          tumbnail_images, ai_response, received_at, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const params = [
        data.id,
        data.url_main,
        data.item_name,
        data.lot_number,
        data.description,
        data.lead,
        data.category,
        data.estimate,
        data.auction_name,
        data.all_unique_image_urls,
        data.main_image_url,
        data.gallery_image_urls,
        data.broad_search_images,
        data.tumbnail_images,
        data.ai_response,
        data.received_at,
        data.status
      ];

      this.db.run(insertSQL, params, function(err) {
        if (err) {
          console.error('Error storing webhook data:', err);
          reject(err);
        } else {
          console.log(`✅ Webhook data stored with ID: ${data.id}`);
          resolve({ ...data, sqlite_id: this.lastID });
        }
      });
    });
  }

  async getWebhookData(): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const selectSQL = 'SELECT * FROM webhook_items ORDER BY created_at DESC';
      
      this.db.all(selectSQL, [], (err, rows) => {
        if (err) {
          console.error('Error retrieving webhook data:', err);
          reject(err);
        } else {
          console.log(`✅ Retrieved ${rows.length} webhook items from SQLite`);
          resolve(rows);
        }
      });
    });
  }

  async getWebhookItemById(id: string): Promise<any> {
    return new Promise((resolve, reject) => {
      const selectSQL = 'SELECT * FROM webhook_items WHERE id = ?';
      
      this.db.get(selectSQL, [id], (err, row) => {
        if (err) {
          console.error('Error retrieving webhook item:', err);
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  async deleteWebhookItem(id: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const deleteSQL = 'DELETE FROM webhook_items WHERE id = ?';
      
      this.db.run(deleteSQL, [id], (err) => {
        if (err) {
          console.error('Error deleting webhook item:', err);
          reject(err);
        } else {
          console.log(`✅ Webhook item deleted: ${id}`);
          resolve();
        }
      });
    });
  }

  async clearAllData(): Promise<void> {
    return new Promise((resolve, reject) => {
      const deleteSQL = 'DELETE FROM webhook_items';
      
      this.db.run(deleteSQL, [], (err) => {
        if (err) {
          console.error('Error clearing webhook data:', err);
          reject(err);
        } else {
          console.log('✅ All webhook data cleared');
          resolve();
        }
      });
    });
  }

  isConnected(): boolean {
    return this.db !== null;
  }

  close(): void {
    if (this.db) {
      this.db.close((err) => {
        if (err) {
          console.error('Error closing SQLite database:', err);
        } else {
          console.log('✅ SQLite database closed');
        }
      });
    }
  }
}

// Export singleton instance
export const sqliteService = new SQLiteService();
