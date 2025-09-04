#!/bin/bash

# 🚀 Bidsquire Auction Platform - Universal Deployment Script
# This script handles deployment for both development and production environments

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT=${1:-"dev"}
COMPOSE_FILE="docker-compose.yml"
ENV_FILE=".env"

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

# Function to check if Docker is running
check_docker() {
    print_status "Checking Docker status..."
    if ! docker info > /dev/null 2>&1; then
        print_error "Docker is not running. Please start Docker Desktop and try again."
        exit 1
    fi
    print_success "Docker is running"
}

# Function to check if required files exist
check_requirements() {
    print_status "Checking requirements..."
    
    if [ ! -f "docker-compose.yml" ]; then
        print_error "docker-compose.yml not found!"
        exit 1
    fi
    
    if [ ! -f "env.production.template" ]; then
        print_error "env.production.template not found!"
        exit 1
    fi
    
    print_success "All required files found"
}

# Function to setup environment file
setup_environment() {
    print_status "Setting up environment configuration..."
    
    if [ "$ENVIRONMENT" = "prod" ]; then
        COMPOSE_FILE="docker-compose.prod.yml"
        ENV_FILE=".env.production"
        
        if [ ! -f "$ENV_FILE" ]; then
            print_warning "Production environment file not found. Creating from template..."
            cp env.production.template "$ENV_FILE"
            print_warning "Please edit $ENV_FILE with your production values before continuing!"
            print_warning "Required variables: SECRET_KEY, POSTGRES_PASSWORD, ADMIN_EMAIL, ADMIN_PASSWORD"
            read -p "Press Enter after you've configured $ENV_FILE..."
        fi
    else
        if [ ! -f "$ENV_FILE" ]; then
            print_warning "Environment file not found. Creating from template..."
            cp env.example "$ENV_FILE"
            print_warning "Please edit $ENV_FILE with your values before continuing!"
            read -p "Press Enter after you've configured $ENV_FILE..."
        fi
    fi
    
    print_success "Environment configuration ready"
}

# Function to stop existing containers
cleanup() {
    print_status "Cleaning up existing containers..."
    docker-compose -f "$COMPOSE_FILE" down --remove-orphans 2>/dev/null || true
    print_success "Cleanup completed"
}

# Function to build images
build_images() {
    print_status "Building Docker images..."
    docker-compose -f "$COMPOSE_FILE" build --no-cache
    print_success "Images built successfully"
}

# Function to start services
start_services() {
    print_status "Starting services..."
    docker-compose -f "$COMPOSE_FILE" up -d
    
    # Wait for services to be ready
    print_status "Waiting for services to start..."
    sleep 10
    
    # Check if services are running
    if ! docker-compose -f "$COMPOSE_FILE" ps | grep -q "Up"; then
        print_error "Some services failed to start. Check logs with: docker-compose -f $COMPOSE_FILE logs"
        exit 1
    fi
    
    print_success "Services started successfully"
}

# Function to wait for database
wait_for_database() {
    print_status "Waiting for database to be ready..."
    
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if docker-compose -f "$COMPOSE_FILE" exec -T postgres pg_isready -U auctionuser -d auctionflow > /dev/null 2>&1; then
            print_success "Database is ready"
            return 0
        fi
        
        print_status "Attempt $attempt/$max_attempts - Database not ready yet, waiting..."
        sleep 2
        ((attempt++))
    done
    
    print_error "Database failed to start within expected time"
    return 1
}

# Function to initialize database
initialize_database() {
    print_status "Initializing database..."
    
    # Wait for database to be ready
    wait_for_database
    
    # Run database migrations
    print_status "Running database migrations..."
    docker-compose -f "$COMPOSE_FILE" exec -T backend python manage.py migrate
    
    # Create admin user if in production
    if [ "$ENVIRONMENT" = "prod" ]; then
        print_status "Creating admin user..."
        docker-compose -f "$COMPOSE_FILE" exec -T frontend node scripts/init-admin.js || true
    fi
    
    print_success "Database initialized"
}

# Function to check service health
check_health() {
    print_status "Checking service health..."
    
    # Check database
    if docker-compose -f "$COMPOSE_FILE" exec -T postgres pg_isready -U auctionuser -d auctionflow > /dev/null 2>&1; then
        print_success "Database: Healthy"
    else
        print_error "Database: Unhealthy"
        return 1
    fi
    
    # Check frontend
    if curl -s http://localhost:3000/api/health > /dev/null 2>&1; then
        print_success "Frontend: Healthy"
    else
        print_warning "Frontend: Not responding (may still be starting up)"
    fi
    
    # Check backend
    if curl -s http://localhost:8000/api/health > /dev/null 2>&1; then
        print_success "Backend: Healthy"
    else
        print_warning "Backend: Not responding (may still be starting up)"
    fi
}

# Function to show deployment summary
show_summary() {
    echo ""
    echo "🎉 Deployment Summary"
    echo "===================="
    echo "Environment: $ENVIRONMENT"
    echo "Compose File: $COMPOSE_FILE"
    echo "Environment File: $ENV_FILE"
    echo ""
    echo "🌐 Access URLs:"
    echo "Frontend: http://localhost:3000"
    echo "Admin Panel: http://localhost:3000/admin"
    echo "API Health: http://localhost:3000/api/health"
    echo ""
    echo "🔑 Admin Login:"
    echo "Check your $ENV_FILE file for ADMIN_EMAIL and ADMIN_PASSWORD"
    echo ""
    echo "📊 Management Commands:"
    echo "View logs: docker-compose -f $COMPOSE_FILE logs -f"
    echo "Stop services: docker-compose -f $COMPOSE_FILE down"
    echo "Restart: docker-compose -f $COMPOSE_FILE restart"
    echo ""
    print_success "Deployment completed successfully! 🚀"
}

# Function to show help
show_help() {
    echo "🚀 Bidsquire Auction Platform Deployment Script"
    echo ""
    echo "Usage: $0 [ENVIRONMENT]"
    echo ""
    echo "ENVIRONMENT:"
    echo "  dev     Development environment (default)"
    echo "  prod    Production environment"
    echo ""
    echo "Examples:"
    echo "  $0          # Deploy development environment"
    echo "  $0 dev      # Deploy development environment"
    echo "  $0 prod     # Deploy production environment"
    echo ""
    echo "Prerequisites:"
    echo "  - Docker Desktop installed and running"
    echo "  - Environment file configured (.env or .env.production)"
    echo ""
}

# Main execution
main() {
    echo "🚀 Bidsquire Auction Platform Deployment"
    echo "========================================"
    echo ""
    
    # Show help if requested
    if [ "$1" = "-h" ] || [ "$1" = "--help" ]; then
        show_help
        exit 0
    fi
    
    print_status "Starting deployment for $ENVIRONMENT environment..."
    
    # Run deployment steps
    check_docker
    check_requirements
    setup_environment
    cleanup
    build_images
    start_services
    initialize_database
    check_health
    show_summary
}

# Run main function with all arguments
main "$@"
