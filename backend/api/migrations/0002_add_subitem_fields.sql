-- Migration: Add sub-item fields and priority default
-- Date: 2024-01-01
-- Description: Add parent_item_id, sub_item_number, and set priority default to 'medium'

-- Add new columns to auction_items table
ALTER TABLE auction_items 
ADD COLUMN IF NOT EXISTS parent_item_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS sub_item_number INTEGER;

-- Add foreign key constraint for parent_item_id
ALTER TABLE auction_items 
ADD CONSTRAINT fk_parent_item 
FOREIGN KEY (parent_item_id) REFERENCES auction_items(id) ON DELETE CASCADE;

-- Set default priority for existing items that don't have priority set
UPDATE auction_items 
SET priority = 'medium' 
WHERE priority IS NULL;

-- Add index for better performance on parent_item_id lookups
CREATE INDEX IF NOT EXISTS idx_auction_items_parent_item_id ON auction_items(parent_item_id);

-- Add index for better performance on priority lookups
CREATE INDEX IF NOT EXISTS idx_auction_items_priority ON auction_items(priority);
