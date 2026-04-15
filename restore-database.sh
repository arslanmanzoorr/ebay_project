#!/bin/bash
# Bidsquire Database Restore Script
# Usage: ./restore-database.sh <backup_file>
# Example: ./restore-database.sh ~/backups/auctionflow_20260415_120000.sql

if [ -z "$1" ]; then
    echo "Usage: ./restore-database.sh <backup_file>"
    echo ""
    echo "Available backups:"
    ls -la ~/backups/auctionflow_*.sql 2>/dev/null || echo "No backups found in ~/backups/"
    exit 1
fi

BACKUP_FILE="$1"

if [ ! -f "$BACKUP_FILE" ]; then
    echo "Error: Backup file not found: $BACKUP_FILE"
    exit 1
fi

echo "WARNING: This will restore the database from: $BACKUP_FILE"
echo "All current data will be replaced!"
read -p "Are you sure? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "Restore cancelled."
    exit 0
fi

echo "Restoring database..."

# Drop and recreate the database
docker exec bidsquire-db-1 psql -U auctionuser -d postgres -c "DROP DATABASE IF EXISTS auctionflow;"
docker exec bidsquire-db-1 psql -U auctionuser -d postgres -c "CREATE DATABASE auctionflow;"

# Restore from backup
cat "$BACKUP_FILE" | docker exec -i bidsquire-db-1 psql -U auctionuser -d auctionflow

if [ $? -eq 0 ]; then
    echo "Database restored successfully!"
    echo "You may need to restart the application: docker-compose restart frontend backend"
else
    echo "Restore failed!"
    exit 1
fi
