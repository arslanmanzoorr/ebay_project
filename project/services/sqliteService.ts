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
    
    // In production, try to create the database file if it doesn't exist
    if (process.env.NODE_ENV === 'production') {
      try {
        const fs = require('fs');
        if (!fs.existsSync(this.dbPath)) {
          console.log('🔧 Creating database file in production...');
          fs.writeFileSync(this.dbPath, '');
          console.log('✅ Database file created successfully');
        }
      } catch (error) {
        console.error('❌ Error creating database file:', error);
      }
    }
    
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
    const createWebhookTableSQL = `
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

    const createUsersTableSQL = `
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT NOT NULL,
        is_active BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `;

    this.db.run(createWebhookTableSQL, (err) => {
      if (err) {
        console.error('❌ Error creating webhook table:', err);
      } else {
        console.log('✅ Webhook table created successfully');
      }
    });

    this.db.run(createUsersTableSQL, (err) => {
      if (err) {
        console.error('❌ Error creating users table:', err);
      } else {
        console.log('✅ Users table created successfully');
        this.initializeAdminUser();
      }
    });
  }

  private initializeAdminUser(): void {
    // Check if admin user exists
    this.db.get('SELECT id FROM users WHERE role = ?', ['admin'], (err, row) => {
      if (err) {
        console.error('❌ Error checking for admin user:', err);
        return;
      }
      
      if (!row) {
        // Create admin user
        const adminUser = {
          id: 'admin-001',
          name: 'Admin User',
          email: 'admin@example.com',
          password: 'admin123',
          role: 'admin',
          is_active: 1
        };

        this.db.run(
          'INSERT INTO users (id, name, email, password, role, is_active) VALUES (?, ?, ?, ?, ?, ?)',
          [adminUser.id, adminUser.name, adminUser.email, adminUser.password, adminUser.role, adminUser.is_active],
          (err) => {
            if (err) {
              console.error('❌ Error creating admin user:', err);
            } else {
              console.log('✅ Admin user created successfully');
              console.log('📧 Email: admin@example.com');
              console.log('🔑 Password: admin123');
            }
          }
        );
      } else {
        console.log('ℹ️ Admin user already exists');
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

  // User management methods
  async getAllUsers(): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const selectSQL = 'SELECT * FROM users ORDER BY created_at DESC';
      
      this.db.all(selectSQL, [], (err, rows) => {
        if (err) {
          console.error('Error retrieving users:', err);
          reject(err);
        } else {
          console.log(`✅ Retrieved ${rows.length} users from SQLite`);
          resolve(rows);
        }
      });
    });
  }

  async getUserById(id: string): Promise<any> {
    return new Promise((resolve, reject) => {
      const selectSQL = 'SELECT * FROM users WHERE id = ?';
      
      this.db.get(selectSQL, [id], (err, row) => {
        if (err) {
          console.error('Error retrieving user:', err);
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  async getUserByEmail(email: string): Promise<any> {
    return new Promise((resolve, reject) => {
      const selectSQL = 'SELECT * FROM users WHERE email = ?';
      
      this.db.get(selectSQL, [email], (err, row) => {
        if (err) {
          console.error('Error retrieving user by email:', err);
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  async createUser(userData: any): Promise<any> {
    return new Promise((resolve, reject) => {
      const id = Date.now().toString();
      const insertSQL = `
        INSERT INTO users (id, name, email, password, role, is_active)
        VALUES (?, ?, ?, ?, ?, ?)
      `;

      const params = [
        id,
        userData.name,
        userData.email,
        userData.password,
        userData.role,
        userData.isActive !== undefined ? userData.isActive : 1
      ];

      this.db.run(insertSQL, params, function(err) {
        if (err) {
          console.error('Error creating user:', err);
          reject(err);
        } else {
          console.log(`✅ User created with ID: ${id}`);
          resolve({ ...userData, id, sqlite_id: this.lastID });
        }
      });
    });
  }

  async updateUser(id: string, updates: any): Promise<any> {
    return new Promise((resolve, reject) => {
      const fields = Object.keys(updates).filter(key => key !== 'id');
      const setClause = fields.map(field => `${field} = ?`).join(', ');
      const values = fields.map(field => updates[field]);
      
      const updateSQL = `
        UPDATE users 
        SET ${setClause}, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `;

      this.db.run(updateSQL, [...values, id], function(err) {
        if (err) {
          console.error('Error updating user:', err);
          reject(err);
        } else {
          if (this.changes > 0) {
            console.log(`✅ User updated: ${id}`);
            resolve({ ...updates, id });
          } else {
            resolve(null);
          }
        }
      });
    });
  }

  async deleteUser(id: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const deleteSQL = 'DELETE FROM users WHERE id = ?';
      
      this.db.run(deleteSQL, [id], function(err) {
        if (err) {
          console.error('Error deleting user:', err);
          reject(err);
        } else {
          console.log(`✅ User deleted: ${id}`);
          resolve(this.changes > 0);
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
