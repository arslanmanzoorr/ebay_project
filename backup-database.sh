#!/bin/bash
# Bidsquire Database Backup Script
# Usage: ./backup-database.sh

BACKUP_DIR=~/backups
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/auctionflow_$TIMESTAMP.sql"

# Create backup directory if it doesn't exist
mkdir -p $BACKUP_DIR

# Create backup
echo "Creating backup: $BACKUP_FILE"
docker exec bidsquire-db-1 pg_dump -U auctionuser auctionflow > "$BACKUP_FILE"

# Check if backup was successful
if [ $? -eq 0 ]; then
    echo "Backup created successfully: $BACKUP_FILE"
    echo "Size: $(du -h "$BACKUP_FILE" | cut -f1)"
    
    # Keep only last 7 backups
    cd $BACKUP_DIR
    ls -t auctionflow_*.sql | tail -n +8 | xargs -r rm
    echo "Cleaned up old backups (keeping last 7)"
else
    echo "Backup failed!"
    exit 1
fi
