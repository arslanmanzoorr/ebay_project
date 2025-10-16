#!/bin/bash

# AuctionFlow Database Initialization Script
# This script properly initializes the database and cleans up everything else

set -e  # Exit on any error

echo "🚀 Starting AuctionFlow Database Initialization..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    print_error "Docker is not running. Please start Docker first."
    exit 1
fi

# Check if docker-compose is available
if ! command -v docker-compose > /dev/null 2>&1; then
    print_error "docker-compose is not installed. Please install docker-compose first."
    exit 1
fi

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    print_status "Creating .env file..."
    cat > .env << 'EOF'
POSTGRES_DB=auctionflow
POSTGRES_USER=auctionuser
POSTGRES_PASSWORD=auctionpass
ADMIN_NAME=Bidsquire Admin
ADMIN_EMAIL=admin@bidsquire.com
ADMIN_PASSWORD=Admin@bids25
NEXT_PUBLIC_API_URL=http://localhost:3000/api
EOF
    print_success ".env file created"
else
    print_warning ".env file already exists, skipping creation"
fi

# Stop any existing containers
print_status "Stopping any existing containers..."
docker-compose -f docker-compose.prod.yml down -v 2>/dev/null || true

# Remove any existing volumes to ensure clean start
print_status "Removing existing volumes for clean initialization..."
docker volume rm ebay_project_postgres_data 2>/dev/null || true

# Start the database container
print_status "Starting PostgreSQL database container..."
docker-compose -f docker-compose.prod.yml --env-file .env up -d postgres

# Wait for database to be ready
print_status "Waiting for database to initialize..."
sleep 15

# Check if database is ready
print_status "Checking database connection..."
max_attempts=30
attempt=1

while [ $attempt -le $max_attempts ]; do
    if docker exec ebay_project_postgres_1 pg_isready -U auctionuser -d auctionflow > /dev/null 2>&1; then
        print_success "Database is ready!"
        break
    fi
    
    if [ $attempt -eq $max_attempts ]; then
        print_error "Database failed to start after $max_attempts attempts"
        print_error "Checking database logs..."
        docker logs ebay_project_postgres_1
        exit 1
    fi
    
    print_status "Attempt $attempt/$max_attempts - waiting for database..."
    sleep 2
    attempt=$((attempt + 1))
done

# Verify database initialization
print_status "Verifying database initialization..."
if docker exec ebay_project_postgres_1 psql -U auctionuser -d auctionflow -c "SELECT COUNT(*) FROM users;" > /dev/null 2>&1; then
    print_success "Database tables created successfully"
else
    print_error "Database initialization failed"
    print_error "Checking database logs..."
    docker logs ebay_project_postgres_1
    exit 1
fi

# Show created users
print_status "Created users:"
docker exec ebay_project_postgres_1 psql -U auctionuser -d auctionflow -c "SELECT name, email, role FROM users;"

# Show credit settings
print_status "Credit settings:"
docker exec ebay_project_postgres_1 psql -U auctionuser -d auctionflow -c "SELECT setting_name, setting_value, description FROM credit_settings;"

print_success "Database initialization completed successfully!"
print_success "You can now start the frontend container with:"
print_success "docker run -d --name ebay-frontend --env-file .env --network ebay_project_app-network -p 3000:3000 -v \$(pwd)/project/public/uploads:/app/public/uploads --restart unless-stopped ebay-frontend:pc-build"

echo ""
print_status "Database is running on port 5432"
print_status "Admin credentials: admin@auctionflow.com / Admin@bids25"
print_status "Super Admin credentials: superadmin@auctionflow.com / SuperAdmin@2024!"
echo ""
print_status "To view database logs: docker logs ebay_project_postgres_1"
print_status "To connect to database: docker exec -it ebay_project_postgres_1 psql -U auctionuser -d auctionflow"
