#!/bin/bash

# 🐳 AuctionFlow Containerization Deployment Script
# This script builds the working PC version and prepares it for server deployment

set -e  # Exit on any error

echo "🐳 AuctionFlow Containerization Deployment"
echo "=========================================="

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

# Build the frontend image
print_status "Building frontend Docker image..."
docker build -t ebay-frontend:pc-build ./project

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

# Save Docker images for transfer
print_status "Saving Docker images for transfer..."
docker save -o ebay-frontend.tar ebay-frontend:pc-build
docker save -o postgres-15-alpine.tar postgres:15-alpine

# Create archive for transfer
print_status "Creating transfer archive..."
tar -czf ebay-project-containers.tar.gz ebay-frontend.tar postgres-15-alpine.tar

print_success "Containerization completed successfully!"
echo ""
print_status "📦 Created files for transfer:"
print_status "  - ebay-project-containers.tar.gz (Complete container archive)"
print_status "  - ebay-frontend.tar (Frontend container)"
print_status "  - postgres-15-alpine.tar (Database container)"
echo ""
print_status "🚀 Next steps for server deployment:"
print_status "  1. Copy ebay-project-containers.tar.gz to your server"
print_status "  2. Extract and load the Docker images"
print_status "  3. Run the database initialization script"
print_status "  4. Start the frontend container"
echo ""
print_status "📋 Default credentials:"
print_status "  Admin: admin@auctionflow.com / Admin@bids25"
print_status "  Super Admin: superadmin@auctionflow.com / SuperAdmin@2024!"
echo ""
print_status "🔧 Test locally (optional):"
print_status "  docker run -d --name frontend-test --env-file .env --network ebay_project_app-network -p 3000:3000 -v \$(pwd)/project/public/uploads:/app/public/uploads ebay-frontend:pc-build"
print_status "  Then visit: http://localhost:3000"
