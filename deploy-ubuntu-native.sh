#!/bin/bash

# ===========================================
# 🚀 Ubuntu Native Frontend Deployment Script
# ===========================================
# This script deploys the frontend natively on Ubuntu
# while keeping the database in Docker
# ===========================================

set -e  # Exit on any error

echo "🚀 Starting Ubuntu Native Frontend Deployment..."

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

# Check if running as root
if [ "$EUID" -eq 0 ]; then
    print_error "Please don't run this script as root. Use a regular user with sudo privileges."
    exit 1
fi

# Check if we're in the right directory
if [ ! -f "docker-compose.yml" ] || [ ! -d "project" ]; then
    print_error "Please run this script from the project root directory (where docker-compose.yml is located)"
    exit 1
fi

print_status "📋 Pre-deployment checks..."

# Check if Docker is installed and running
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed. Please install Docker first."
    exit 1
fi

if ! docker info &> /dev/null; then
    print_error "Docker is not running. Please start Docker first."
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_status "Node.js not found. Installing Node.js 18..."
    
    # Update package index
    sudo apt-get update
    
    # Install Node.js 18
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
    
    print_success "Node.js installed successfully"
else
    NODE_VERSION=$(node --version)
    print_success "Node.js is already installed: $NODE_VERSION"
fi

# Check if PM2 is installed
if ! command -v pm2 &> /dev/null; then
    print_status "PM2 not found. Installing PM2 globally..."
    sudo npm install -g pm2
    print_success "PM2 installed successfully"
else
    PM2_VERSION=$(pm2 --version)
    print_success "PM2 is already installed: $PM2_VERSION"
fi

print_status "🗄️ Starting PostgreSQL database in Docker..."

# Start the database container
docker-compose up -d db

# Wait for database to be ready
print_status "⏳ Waiting for database to be ready..."
sleep 10

# Check if database is running
if ! docker ps | grep -q "ebay_project-db-1"; then
    print_error "Failed to start database container"
    exit 1
fi

print_success "Database container is running"

print_status "📦 Installing frontend dependencies..."

# Navigate to project directory
cd project

# Install dependencies
npm install

print_success "Frontend dependencies installed"

print_status "🔧 Setting up environment variables..."

# Create .env.local if it doesn't exist
if [ ! -f ".env.local" ]; then
    print_status "Creating .env.local file..."
    cat > .env.local << EOF
# Database Configuration
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=auctionflow
POSTGRES_USER=auctionuser
POSTGRES_PASSWORD=auctionpass123

# Admin Configuration
ADMIN_NAME=Bidsquire Admin
ADMIN_EMAIL=admin@bidsquire.com
ADMIN_PASSWORD=Admin@bids25

# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3000/api
EOF
    print_success ".env.local created"
else
    print_success ".env.local already exists"
fi

print_status "🏗️ Building the application..."

# Build the application
npm run build

print_success "Application built successfully"

print_status "🚀 Starting the application with PM2..."

# Stop any existing PM2 processes
pm2 stop all 2>/dev/null || true
pm2 delete all 2>/dev/null || true

# Start the application with PM2
pm2 start npm --name "ebay-frontend" -- start

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup

print_success "Application started with PM2"

print_status "🔍 Checking application status..."

# Wait a moment for the app to start
sleep 5

# Check if the application is running
if pm2 list | grep -q "ebay-frontend.*online"; then
    print_success "Application is running successfully!"
    
    # Get the application URL
    APP_URL="http://localhost:3000"
    print_success "🌐 Application is available at: $APP_URL"
    
    # Show PM2 status
    print_status "📊 PM2 Process Status:"
    pm2 list
    
    print_status "📝 Useful PM2 commands:"
    echo "  - View logs: pm2 logs ebay-frontend"
    echo "  - Restart app: pm2 restart ebay-frontend"
    echo "  - Stop app: pm2 stop ebay-frontend"
    echo "  - Monitor: pm2 monit"
    
else
    print_error "Application failed to start. Check logs with: pm2 logs ebay-frontend"
    exit 1
fi

print_success "🎉 Deployment completed successfully!"
print_status "Your eBay auction platform is now running natively on Ubuntu!"
print_status "Database is running in Docker, frontend is running natively with PM2."
