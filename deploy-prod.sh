#!/bin/bash

# Production Deployment Script for Ubuntu
# This script deploys the auction workflow application to production

set -e  # Exit on any error

echo "🚀 Starting production deployment on Ubuntu..."

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
if [[ $EUID -eq 0 ]]; then
   print_error "This script should not be run as root. Please run as a regular user with sudo privileges."
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

# Load environment variables
if [ -f .env.prod ]; then
    print_status "Loading production environment variables..."
    export $(grep -v '^#' .env.prod | xargs)
else
    print_error ".env.prod file not found!"
    echo "Please create .env.prod file first using: cp env.prod.template .env.prod"
    echo "Then update the values in .env.prod file."
    exit 1
fi

# Create necessary directories
print_status "Creating necessary directories..."
mkdir -p nginx/logs nginx/ssl postgres-init

# Stop and remove existing containers
print_status "Stopping existing containers..."
docker-compose -f docker-compose.prod.yml down -v

# Clean up Docker system
print_status "Cleaning up Docker system..."
docker system prune -af
docker volume prune -f

# Build and start services
print_status "Building and starting production services..."
docker-compose -f docker-compose.prod.yml up -d --build

# Wait for services to be ready
print_status "Waiting for services to be ready..."
sleep 45

# Check service health
print_status "Checking service health..."
docker-compose -f docker-compose.prod.yml ps

# Wait for database to be ready
print_status "Waiting for database to be ready..."
until docker-compose -f docker-compose.prod.yml exec -T db pg_isready -U ${POSTGRES_USER:-auctionuser} -d ${POSTGRES_DB:-auctionflow}; do
    print_status "Database not ready yet, waiting..."
    sleep 5
done

print_success "Database is ready!"

# Initialize database if needed
print_status "Checking if database needs initialization..."
if ! docker-compose -f docker-compose.prod.yml exec -T db psql -U ${POSTGRES_USER:-auctionuser} -d ${POSTGRES_DB:-auctionflow} -c "SELECT 1" &> /dev/null; then
    print_status "Initializing database..."
    docker-compose -f docker-compose.prod.yml exec -T db psql -U ${POSTGRES_USER:-auctionuser} -d ${POSTGRES_DB:-auctionflow} -c "CREATE DATABASE auctionflow;" || true
fi

# Check Redis connection
print_status "Checking Redis connection..."
if docker-compose -f docker-compose.prod.yml exec -T redis redis-cli -a ${REDIS_PASSWORD:-redispass123} ping | grep -q "PONG"; then
    print_success "Redis is ready!"
else
    print_warning "Redis connection check failed, but continuing..."
fi

# Check frontend health
print_status "Checking frontend health..."
if curl -f http://localhost:3000/api/health &> /dev/null; then
    print_success "Frontend is healthy!"
else
    print_warning "Frontend health check failed, but continuing..."
fi

# Check nginx health
print_status "Checking nginx health..."
if curl -f http://localhost/health &> /dev/null; then
    print_success "Nginx is healthy!"
else
    print_warning "Nginx health check failed, but continuing..."
fi

# Final status check
print_status "Final service status:"
docker-compose -f docker-compose.prod.yml ps

echo ""
print_success "Production deployment completed successfully!"
echo ""
echo "🌐 Your application is now running at:"
echo "   Frontend: http://localhost:3000"
echo "   Nginx: http://localhost"
echo "   API: http://localhost/api"
echo ""
echo "📊 Service Information:"
echo "   PostgreSQL: localhost:5432"
echo "   Redis: localhost:6379"
echo ""
echo "🔐 Default Admin Credentials:"
echo "   Email: ${ADMIN_EMAIL:-admin@example.com}"
echo "   Password: ${ADMIN_PASSWORD:-admin123}"
echo ""
echo "📋 Useful Commands:"
echo "   View logs: docker-compose -f docker-compose.prod.yml logs -f"
echo "   Stop services: docker-compose -f docker-compose.prod.yml down"
echo "   Restart services: docker-compose -f docker-compose.prod.yml restart"
echo "   Update services: docker-compose -f docker-compose.prod.yml up -d --build"
echo ""
print_warning "IMPORTANT: Change admin password after first login!"
print_warning "IMPORTANT: Update environment variables in .env.prod for production use!"
print_warning "IMPORTANT: Configure SSL certificates for production deployment!"
echo ""
print_success "Deployment script completed successfully!"
