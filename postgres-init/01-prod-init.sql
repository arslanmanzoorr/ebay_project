-- PostgreSQL initialization script for AuctionFlow (Production)
-- This script runs automatically when PostgreSQL container starts for the first time
-- Creates all necessary tables and default admin user

-- Enable UUID extension for better ID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create the users table
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

-- Create the webhook_items table
CREATE TABLE IF NOT EXISTS webhook_items (
    id VARCHAR(255) PRIMARY KEY,
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
    received_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_multiple_items BOOLEAN DEFAULT false,
    multiple_items_count INTEGER DEFAULT 1,
    priority VARCHAR(20) DEFAULT 'medium',
    parent_item_id VARCHAR(255),
    sub_item_number INTEGER,
    photographer_notes TEXT
);

-- Create auction_items table (for production)
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
    is_multiple_items BOOLEAN DEFAULT false,
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
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active);
CREATE INDEX IF NOT EXISTS idx_webhook_items_status ON webhook_items(status);
CREATE INDEX IF NOT EXISTS idx_webhook_items_created_at ON webhook_items(created_at);
CREATE INDEX IF NOT EXISTS idx_webhook_items_priority ON webhook_items(priority);
CREATE INDEX IF NOT EXISTS idx_webhook_items_parent_item_id ON webhook_items(parent_item_id);
CREATE INDEX IF NOT EXISTS idx_auction_items_status ON auction_items(status);
CREATE INDEX IF NOT EXISTS idx_auction_items_assigned_to ON auction_items(assigned_to);
CREATE INDEX IF NOT EXISTS idx_auction_items_priority ON auction_items(priority);
CREATE INDEX IF NOT EXISTS idx_auction_items_parent_item_id ON auction_items(parent_item_id);
CREATE INDEX IF NOT EXISTS idx_auction_items_sub_item_number ON auction_items(sub_item_number);
CREATE INDEX IF NOT EXISTS idx_auction_items_admin_id ON auction_items(admin_id);

-- Create user_credits table
CREATE TABLE IF NOT EXISTS user_credits (
    id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    current_credits INTEGER DEFAULT 60,
    total_purchased INTEGER DEFAULT 60,
    last_topup_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create credit_transactions table
CREATE TABLE IF NOT EXISTS credit_transactions (
    id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    transaction_type VARCHAR(50) NOT NULL,
    amount INTEGER NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create credit_settings table
CREATE TABLE IF NOT EXISTS credit_settings (
    id VARCHAR(255) PRIMARY KEY,
    setting_name VARCHAR(100) UNIQUE NOT NULL,
    setting_value INTEGER NOT NULL,
    description TEXT,
    updated_by VARCHAR(255),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Add created_by field to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS created_by VARCHAR(255);

-- Add foreign key constraint (only if it doesn't exist)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_users_created_by' 
        AND table_name = 'users'
    ) THEN
        ALTER TABLE users ADD CONSTRAINT fk_users_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Create indexes for new tables
CREATE INDEX IF NOT EXISTS idx_user_credits_user_id ON user_credits(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_id ON credit_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_type ON credit_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_credit_settings_name ON credit_settings(setting_name);
CREATE INDEX IF NOT EXISTS idx_users_created_by ON users(created_by);

-- Insert default admin user (always create on first run)
INSERT INTO users (id, name, email, password, role, created_at, updated_at, is_active)
VALUES (
    'admin-auctionflow-001',
    'AuctionFlow Admin',
    'admin@auctionflow.com',
    'Admin@bids25',
    'admin',
    NOW(),
    NOW(),
    TRUE
) ON CONFLICT (email) DO UPDATE SET
    name = EXCLUDED.name,
    password = EXCLUDED.password,
    role = EXCLUDED.role,
    updated_at = NOW(),
    is_active = TRUE;

-- Insert super admin user
INSERT INTO users (id, name, email, password, role, created_at, updated_at, is_active)
VALUES (
    'super-admin-001',
    'Super Administrator',
    'superadmin@auctionflow.com',
    'SuperAdmin@2024!',
    'super_admin',
    NOW(),
    NOW(),
    TRUE
) ON CONFLICT (email) DO NOTHING;

-- Insert default credit settings
INSERT INTO credit_settings (id, setting_name, setting_value, description, updated_by)
VALUES 
    ('fetch-cost-001', 'item_fetch_cost', 1, 'Credits deducted per item fetched from n8n', 'super-admin-001'),
    ('research2-cost-001', 'research2_cost', 2, 'Credits deducted when item reaches research2 stage', 'super-admin-001')
ON CONFLICT (setting_name) DO NOTHING;

-- Initialize credits for existing admin users
INSERT INTO user_credits (id, user_id, current_credits, total_purchased, created_at, updated_at)
SELECT 
    'credits-' || u.id,
    u.id,
    60,
    60,
    NOW(),
    NOW()
FROM users u 
WHERE u.role = 'admin' 
AND NOT EXISTS (SELECT 1 FROM user_credits uc WHERE uc.user_id = u.id);

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update updated_at
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_webhook_items_updated_at ON webhook_items;
CREATE TRIGGER update_webhook_items_updated_at
    BEFORE UPDATE ON webhook_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Log successful initialization
DO $$
BEGIN
    RAISE NOTICE 'AuctionFlow database initialized successfully!';
    RAISE NOTICE 'Admin user created: admin@auctionflow.com';
    RAISE NOTICE 'Super Admin user created: superadmin@auctionflow.com';
END $$;