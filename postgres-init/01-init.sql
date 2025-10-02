-- AuctionFlow Database Initialization
-- This script runs when the PostgreSQL container starts for the first time

-- Create the main database (if not exists)
SELECT 'CREATE DATABASE auctionflow'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'auctionflow')\gexec

-- Connect to the auctionflow database
\c auctionflow;

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true
);

-- Create auction_items table
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
    FOREIGN KEY (parent_item_id) REFERENCES auction_items(id) ON DELETE CASCADE
);

-- Create workflow_steps table
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
);

-- Create notifications table
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
);

-- Create webhook_data table
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
);

-- Create admin user
INSERT INTO users (id, name, email, password, role, is_active)
VALUES (
    'admin-001',
    'Bidsquire Admin',
    'admin@bidsquire.com',
    'Admin@bids25',
    'admin',
    true
) ON CONFLICT (email) DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_auction_items_status ON auction_items(status);
CREATE INDEX IF NOT EXISTS idx_auction_items_assigned_to ON auction_items(assigned_to);
CREATE INDEX IF NOT EXISTS idx_auction_items_priority ON auction_items(priority);
CREATE INDEX IF NOT EXISTS idx_auction_items_parent_item_id ON auction_items(parent_item_id);
CREATE INDEX IF NOT EXISTS idx_auction_items_sub_item_number ON auction_items(sub_item_number);
CREATE INDEX IF NOT EXISTS idx_workflow_steps_item_id ON workflow_steps(item_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_webhook_data_status ON webhook_data(status);

-- Grant permissions
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO auctionuser;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO auctionuser;
