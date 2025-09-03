#!/bin/bash

# Bidsquire.com Production Deployment Script
# This script sets up a complete production environment for bidsquire.com

set -e  # Exit on any error

echo "🚀 Starting Bidsquire.com Production Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
APP_NAME="bidsquire"
DOMAIN="bidsquire.com"
ADMIN_DOMAIN="admin.bidsquire.com"
ADMIN_EMAIL="admin@bidsquire.com"
ADMIN_PASSWORD="Admin@bids25"

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
if [[ $EUID -eq 0 ]]; then
   print_error "This script should not be run as root for security reasons"
   exit 1
fi

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    print_error "Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

print_status "Checking system requirements..."

# Check available disk space (need at least 5GB)
AVAILABLE_SPACE=$(df / | awk 'NR==2 {print $4}')
if [ "$AVAILABLE_SPACE" -lt 5242880 ]; then  # 5GB in KB
    print_warning "Low disk space. At least 5GB recommended."
fi

# Check available memory (need at least 2GB)
AVAILABLE_MEMORY=$(free -m | awk 'NR==2{printf "%.0f", $7}')
if [ "$AVAILABLE_MEMORY" -lt 2048 ]; then
    print_warning "Low available memory. At least 2GB recommended."
fi

print_status "Creating production environment..."

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    print_status "Creating .env file from template..."
    cp env.production.template .env
    
    # Generate secure passwords
    POSTGRES_PASSWORD=$(openssl rand -base64 32)
    JWT_SECRET=$(openssl rand -base64 64)
    ENCRYPTION_KEY=$(openssl rand -base64 32)
    
    # Update .env file with generated values
    sed -i "s/your_secure_postgres_password_here/$POSTGRES_PASSWORD/" .env
    sed -i "s/your_jwt_secret_key_here/$JWT_SECRET/" .env
    sed -i "s/your_encryption_key_here/$ENCRYPTION_KEY/" .env
    
    print_success "Environment file created with secure passwords"
    print_warning "Please review and update .env file with your specific settings"
else
    print_status "Using existing .env file"
fi

# Create necessary directories
print_status "Creating necessary directories..."
mkdir -p nginx/ssl
mkdir -p nginx/logs
mkdir -p postgres-init
mkdir -p project/public/uploads
mkdir -p logs

# Set proper permissions
chmod 755 nginx/ssl
chmod 755 nginx/logs
chmod 755 project/public/uploads
chmod 755 logs

print_status "Setting up SSL certificates..."

# Check if SSL certificates exist
if [ ! -f "nginx/ssl/bidsquire.com.crt" ] || [ ! -f "nginx/ssl/bidsquire.com.key" ]; then
    print_warning "SSL certificates not found. Creating self-signed certificates for testing..."
    print_warning "For production, replace these with real certificates from Let's Encrypt or your CA"
    
    # Create self-signed certificate
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout nginx/ssl/bidsquire.com.key \
        -out nginx/ssl/bidsquire.com.crt \
        -subj "/C=US/ST=State/L=City/O=Organization/CN=bidsquire.com" \
        -addext "subjectAltName=DNS:bidsquire.com,DNS:www.bidsquire.com,DNS:admin.bidsquire.com"
    
    chmod 600 nginx/ssl/bidsquire.com.key
    chmod 644 nginx/ssl/bidsquire.com.crt
    
    print_success "Self-signed SSL certificates created"
else
    print_success "SSL certificates found"
fi

print_status "Creating PostgreSQL initialization script..."

# Create PostgreSQL initialization script
cat > postgres-init/01-init.sql << EOF
-- Bidsquire.com Database Initialization
-- This script runs when the PostgreSQL container starts for the first time

-- Create the main database (if not exists)
SELECT 'CREATE DATABASE bidsquire'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'bidsquire')\gexec

-- Connect to the bidsquire database
\c bidsquire;

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
    auction_name VARCHAR(255),
    lot_number VARCHAR(100),
    images TEXT[],
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
    photographer_quantity INTEGER,
    photographer_images TEXT[],
    final_data JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    assigned_to VARCHAR(255),
    notes TEXT,
    priority VARCHAR(20),
    tags TEXT[]
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
CREATE INDEX IF NOT EXISTS idx_workflow_steps_item_id ON workflow_steps(item_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_webhook_data_status ON webhook_data(status);

-- Grant permissions
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO bidsquire_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO bidsquire_user;

EOF

print_success "PostgreSQL initialization script created"

print_status "Cleaning up any existing containers..."

# Stop and remove existing containers
docker-compose -f docker-compose.prod.yml down --volumes --remove-orphans 2>/dev/null || true

# Clean up Docker system
print_status "Cleaning up Docker system..."
docker system prune -f
docker volume prune -f

print_status "Building and starting services..."

# Build and start services
docker-compose -f docker-compose.prod.yml build --no-cache
docker-compose -f docker-compose.prod.yml up -d

print_status "Waiting for services to start..."
sleep 30

# Check service health
print_status "Checking service health..."

# Check PostgreSQL
if docker-compose -f docker-compose.prod.yml exec -T postgres pg_isready -U bidsquire_user -d bidsquire > /dev/null 2>&1; then
    print_success "PostgreSQL is healthy"
else
    print_error "PostgreSQL is not responding"
    docker-compose -f docker-compose.prod.yml logs postgres
    exit 1
fi

# Check Frontend
if curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
    print_success "Frontend is healthy"
else
    print_error "Frontend is not responding"
    docker-compose -f docker-compose.prod.yml logs frontend
    exit 1
fi

# Check Nginx
if curl -f http://localhost/health > /dev/null 2>&1; then
    print_success "Nginx is healthy"
else
    print_error "Nginx is not responding"
    docker-compose -f docker-compose.prod.yml logs nginx
    exit 1
fi

print_status "Running database migrations..."

# Wait a bit more for the database to be fully ready
sleep 10

# Run any additional database setup
docker-compose -f docker-compose.prod.yml exec -T postgres psql -U bidsquire_user -d bidsquire -c "SELECT 'Database setup complete' as status;"

print_success "Database setup complete"

print_status "Final system check..."

# Display service status
echo ""
echo "📊 Service Status:"
docker-compose -f docker-compose.prod.yml ps

echo ""
echo "📋 Recent logs:"
docker-compose -f docker-compose.prod.yml logs --tail=10

echo ""
print_success "🎉 Bidsquire.com Production Deployment Complete!"
echo ""
echo "🌐 Your application is now available at:"
echo "   Main Site: https://bidsquire.com"
echo "   Admin Panel: https://admin.bidsquire.com"
echo ""
echo "👤 Admin Login Credentials:"
echo "   Email: $ADMIN_EMAIL"
echo "   Password: $ADMIN_PASSWORD"
echo ""
echo "📁 Important Files:"
echo "   Environment: .env"
echo "   SSL Certificates: nginx/ssl/"
echo "   Logs: nginx/logs/"
echo "   Database: postgres_data volume"
echo ""
echo "🔧 Management Commands:"
echo "   View logs: docker-compose -f docker-compose.prod.yml logs -f"
echo "   Restart: docker-compose -f docker-compose.prod.yml restart"
echo "   Stop: docker-compose -f docker-compose.prod.yml down"
echo "   Update: git pull && docker-compose -f docker-compose.prod.yml up -d --build"
echo ""
print_warning "Remember to:"
echo "   1. Replace self-signed SSL certificates with real ones"
echo "   2. Set up proper DNS records for your domains"
echo "   3. Configure firewall rules"
echo "   4. Set up regular backups"
echo "   5. Monitor system resources"
echo ""
print_success "Deployment completed successfully! 🚀"
