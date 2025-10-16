#!/bin/bash

# Database-Only Deployment Script for Ubuntu
# This script deploys only the PostgreSQL database container
# Nginx will be hosted separately on Ubuntu

set -e  # Exit on any error

echo "🚀 Starting Database-Only Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="ebay_project"
DB_CONTAINER_NAME="${PROJECT_NAME}_postgres_1"
DB_VOLUME_NAME="${PROJECT_NAME}_postgres_data"
NETWORK_NAME="${PROJECT_NAME}_default"

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
    if ! docker info > /dev/null 2>&1; then
        print_error "Docker is not running. Please start Docker and try again."
        exit 1
    fi
    print_success "Docker is running"
}

# Function to check if Docker Compose is available
check_docker_compose() {
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed. Please install it first."
        exit 1
    fi
    print_success "Docker Compose is available"
}

# Function to stop and remove existing containers
cleanup_existing() {
    print_status "Cleaning up existing containers..."
    
    # Stop and remove existing containers
    if docker ps -a --format "table {{.Names}}" | grep -q "$DB_CONTAINER_NAME"; then
        print_status "Stopping existing database container..."
        docker stop "$DB_CONTAINER_NAME" || true
        docker rm "$DB_CONTAINER_NAME" || true
        print_success "Existing container removed"
    fi
    
    # Remove existing volumes (optional - uncomment if you want fresh data)
    # if docker volume ls --format "table {{.Name}}" | grep -q "$DB_VOLUME_NAME"; then
    #     print_warning "Removing existing database volume..."
    #     docker volume rm "$DB_VOLUME_NAME" || true
    #     print_success "Existing volume removed"
    # fi
}

# Function to create database-only docker-compose file
create_db_compose() {
    print_status "Creating database-only Docker Compose configuration..."
    
    cat > docker-compose.db-only.yml << EOF
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: ${DB_CONTAINER_NAME}
    restart: unless-stopped
    environment:
      POSTGRES_DB: auctionflow
      POSTGRES_USER: auctionuser
      POSTGRES_PASSWORD: \${DB_PASSWORD:-AuctionFlow2024!}
      POSTGRES_INITDB_ARGS: "--encoding=UTF-8 --lc-collate=C --lc-ctype=C"
    ports:
      - "5432:5432"
    volumes:
      - ${DB_VOLUME_NAME}:/var/lib/postgresql/data
      - ./postgres-init:/docker-entrypoint-initdb.d
    networks:
      - ${NETWORK_NAME}
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U auctionuser -d auctionflow"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  ${DB_VOLUME_NAME}:
    driver: local

networks:
  ${NETWORK_NAME}:
    driver: bridge
EOF

    print_success "Database-only Docker Compose file created"
}

# Function to set up environment variables
setup_environment() {
    print_status "Setting up environment variables..."
    
    if [ ! -f .env ]; then
        cat > .env << EOF
# Database Configuration
DB_PASSWORD=AuctionFlow2024!
POSTGRES_DB=auctionflow
POSTGRES_USER=auctionuser

# Application Configuration (for reference)
NEXTAUTH_SECRET=your-secret-key-here
NEXTAUTH_URL=http://localhost:3000
DATABASE_URL=postgresql://auctionuser:AuctionFlow2024!@localhost:5432/auctionflow
EOF
        print_success "Environment file created"
    else
        print_warning "Environment file already exists, skipping creation"
    fi
}

# Function to deploy database
deploy_database() {
    print_status "Deploying PostgreSQL database..."
    
    # Start the database container
    docker-compose -f docker-compose.db-only.yml up -d postgres
    
    # Wait for database to be ready
    print_status "Waiting for database to be ready..."
    timeout=60
    counter=0
    
    while [ $counter -lt $timeout ]; do
        if docker exec "$DB_CONTAINER_NAME" pg_isready -U auctionuser -d auctionflow > /dev/null 2>&1; then
            print_success "Database is ready!"
            break
        fi
        
        echo -n "."
        sleep 2
        counter=$((counter + 2))
    done
    
    if [ $counter -ge $timeout ]; then
        print_error "Database failed to start within $timeout seconds"
        exit 1
    fi
}

# Function to verify database setup
verify_database() {
    print_status "Verifying database setup..."
    
    # Check if tables were created
    tables=$(docker exec "$DB_CONTAINER_NAME" psql -U auctionuser -d auctionflow -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" | tr -d ' ')
    
    if [ "$tables" -gt 0 ]; then
        print_success "Database tables created successfully ($tables tables found)"
    else
        print_warning "No tables found in database"
    fi
    
    # Check if super admin user exists
    admin_count=$(docker exec "$DB_CONTAINER_NAME" psql -U auctionuser -d auctionflow -t -c "SELECT COUNT(*) FROM users WHERE role = 'super_admin';" | tr -d ' ')
    
    if [ "$admin_count" -gt 0 ]; then
        print_success "Super Admin user created successfully"
    else
        print_warning "Super Admin user not found"
    fi
    
    # Check if credit settings exist
    settings_count=$(docker exec "$DB_CONTAINER_NAME" psql -U auctionuser -d auctionflow -t -c "SELECT COUNT(*) FROM credit_settings;" | tr -d ' ')
    
    if [ "$settings_count" -gt 0 ]; then
        print_success "Credit settings initialized successfully"
    else
        print_warning "Credit settings not found"
    fi
}

# Function to show connection information
show_connection_info() {
    print_success "Database deployment completed!"
    echo ""
    echo "📊 Database Connection Information:"
    echo "  Host: localhost"
    echo "  Port: 5432"
    echo "  Database: auctionflow"
    echo "  Username: auctionuser"
    echo "  Password: AuctionFlow2024!"
    echo ""
    echo "🔐 Default Users:"
    echo "  Super Admin: superadmin@auctionflow.com / SuperAdmin@2024!"
    echo "  Admin: admin@auctionflow.com / Admin@bids25"
    echo ""
    echo "📋 Useful Commands:"
    echo "  View logs: docker logs $DB_CONTAINER_NAME"
    echo "  Connect to DB: docker exec -it $DB_CONTAINER_NAME psql -U auctionuser -d auctionflow"
    echo "  Stop database: docker-compose -f docker-compose.db-only.yml down"
    echo "  Start database: docker-compose -f docker-compose.db-only.yml up -d"
    echo ""
    echo "🌐 For your Next.js application, use this DATABASE_URL:"
    echo "  DATABASE_URL=postgresql://auctionuser:AuctionFlow2024!@localhost:5432/auctionflow"
}

# Function to create management scripts
create_management_scripts() {
    print_status "Creating management scripts..."
    
    # Create start script
    cat > start-database.sh << 'EOF'
#!/bin/bash
echo "🚀 Starting database..."
docker-compose -f docker-compose.db-only.yml up -d
echo "✅ Database started!"
EOF
    chmod +x start-database.sh
    
    # Create stop script
    cat > stop-database.sh << 'EOF'
#!/bin/bash
echo "🛑 Stopping database..."
docker-compose -f docker-compose.db-only.yml down
echo "✅ Database stopped!"
EOF
    chmod +x stop-database.sh
    
    # Create restart script
    cat > restart-database.sh << 'EOF'
#!/bin/bash
echo "🔄 Restarting database..."
docker-compose -f docker-compose.db-only.yml down
docker-compose -f docker-compose.db-only.yml up -d
echo "✅ Database restarted!"
EOF
    chmod +x restart-database.sh
    
    # Create backup script
    cat > backup-database.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="./backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/auctionflow_backup_$TIMESTAMP.sql"

mkdir -p "$BACKUP_DIR"

echo "📦 Creating database backup..."
docker exec ebay_project_postgres_1 pg_dump -U auctionuser -d auctionflow > "$BACKUP_FILE"

if [ $? -eq 0 ]; then
    echo "✅ Backup created: $BACKUP_FILE"
else
    echo "❌ Backup failed!"
    exit 1
fi
EOF
    chmod +x backup-database.sh
    
    print_success "Management scripts created"
}

# Main deployment function
main() {
    echo "🎯 Database-Only Deployment Script"
    echo "=================================="
    echo ""
    
    # Pre-flight checks
    check_docker
    check_docker_compose
    
    # Setup
    setup_environment
    create_db_compose
    create_management_scripts
    
    # Cleanup existing containers
    cleanup_existing
    
    # Deploy
    deploy_database
    
    # Verify
    verify_database
    
    # Show information
    show_connection_info
    
    echo ""
    print_success "🎉 Database deployment completed successfully!"
    echo ""
    echo "📁 Created files:"
    echo "  - docker-compose.db-only.yml (Database configuration)"
    echo "  - .env (Environment variables)"
    echo "  - start-database.sh (Start database)"
    echo "  - stop-database.sh (Stop database)"
    echo "  - restart-database.sh (Restart database)"
    echo "  - backup-database.sh (Backup database)"
    echo ""
    echo "🚀 Next steps:"
    echo "  1. Configure your nginx to proxy to your Next.js app"
    echo "  2. Set up your Next.js app with the DATABASE_URL"
    echo "  3. Start your Next.js application"
    echo "  4. Access the Super Admin panel at /super-admin"
}

# Run main function
main "$@"
