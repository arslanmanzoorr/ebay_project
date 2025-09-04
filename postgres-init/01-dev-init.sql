-- PostgreSQL initialization script for Bidsquire
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
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "isActive" BOOLEAN DEFAULT TRUE
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
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_active ON users("isActive");
CREATE INDEX IF NOT EXISTS idx_webhook_items_status ON webhook_items(status);
CREATE INDEX IF NOT EXISTS idx_webhook_items_created_at ON webhook_items(created_at);

-- Insert default admin user (always create on first run)
INSERT INTO users (id, name, email, password, role, "createdAt", "updatedAt", "isActive")
VALUES (
    'admin-bidsquire-001',
    'Bidsquire Admin',
    'admin@bidsquire.com',
    'Admin@bids25',
    'admin',
    NOW(),
    NOW(),
    TRUE
) ON CONFLICT (email) DO UPDATE SET
    name = EXCLUDED.name,
    password = EXCLUDED.password,
    role = EXCLUDED.role,
    "updatedAt" = NOW(),
    "isActive" = TRUE;

-- Insert test user for development
INSERT INTO users (id, name, email, password, role, "createdAt", "updatedAt", "isActive")
VALUES (
    'test-user-001',
    'Test User',
    'test@example.com',
    'test123',
    'researcher',
    NOW(),
    NOW(),
    TRUE
) ON CONFLICT (email) DO UPDATE SET
    name = EXCLUDED.name,
    password = EXCLUDED.password,
    role = EXCLUDED.role,
    "updatedAt" = NOW(),
    "isActive" = TRUE;

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = NOW();
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
    RAISE NOTICE 'Bidsquire database initialized successfully!';
    RAISE NOTICE 'Admin user created: admin@bidsquire.com';
    RAISE NOTICE 'Test user created: test@example.com';
END $$;
