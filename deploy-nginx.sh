#!/bin/bash

# Bidsquire Nginx Deployment Script
# Handles both development and production deployments

set -e

echo "🚀 Bidsquire Nginx Deployment Script"
echo "====================================="

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

# Function to deploy development environment
deploy_dev() {
    echo "🔧 Deploying Development Environment (HTTP only)..."
    
    # Stop existing containers
    docker-compose -f docker-compose.dev.yml down --remove-orphans 2>/dev/null || true
    
    # Build and start services
    docker-compose -f docker-compose.dev.yml up -d --build
    
    echo "✅ Development environment deployed!"
    echo "🌐 Access your app at: http://localhost"
    echo "🔍 Health check: http://localhost/health"
}

# Function to deploy production environment
deploy_prod() {
    echo "🏭 Deploying Production Environment (HTTPS)..."
    
    # Check if SSL certificates exist
    if [ ! -f "nginx/ssl/bidsquire.com.crt" ] || [ ! -f "nginx/ssl/bidsquire.com.key" ]; then
        echo "⚠️  SSL certificates not found. Generating self-signed certificates..."
        echo "   For production, replace these with proper SSL certificates!"
        
        # Generate self-signed certificates
        cd nginx
        chmod +x generate-ssl.sh
        ./generate-ssl.sh
        cd ..
    fi
    
    # Stop existing containers
    docker-compose -f docker-compose.prod.yml down --remove-orphans 2>/dev/null || true
    
    # Build and start services
    docker-compose -f docker-compose.prod.yml up -d --build
    
    echo "✅ Production environment deployed!"
    echo "🌐 Access your app at: https://bidsquire.com"
    echo "🔍 Admin panel at: https://admin.bidsquire.com"
    echo "🔍 Health check: https://bidsquire.com/health"
}

# Function to check deployment status
check_status() {
    echo "📊 Checking deployment status..."
    
    # Check if development is running
    if docker-compose -f docker-compose.dev.yml ps | grep -q "Up"; then
        echo "✅ Development environment is running"
        echo "   - Frontend: http://localhost:3000"
        echo "   - Nginx: http://localhost"
    else
        echo "❌ Development environment is not running"
    fi
    
    # Check if production is running
    if docker-compose -f docker-compose.prod.yml ps | grep -q "Up"; then
        echo "✅ Production environment is running"
        echo "   - Frontend: https://bidsquire.com"
        echo "   - Admin: https://admin.bidsquire.com"
    else
        echo "❌ Production environment is not running"
    fi
}

# Function to show logs
show_logs() {
    local env=${1:-dev}
    
    if [ "$env" = "prod" ]; then
        echo "📋 Showing production logs..."
        docker-compose -f docker-compose.prod.yml logs -f
    else
        echo "📋 Showing development logs..."
        docker-compose -f docker-compose.dev.yml logs -f
    fi
}

# Function to clean up
cleanup() {
    echo "🧹 Cleaning up Docker resources..."
    
    # Stop all containers
    docker-compose -f docker-compose.dev.yml down --volumes --remove-orphans 2>/dev/null || true
    docker-compose -f docker-compose.prod.yml down --volumes --remove-orphans 2>/dev/null || true
    
    # Remove images
    docker rmi $(docker images -q 'ebay_project_*') 2>/dev/null || true
    docker rmi $(docker images -q 'bidsquire_*') 2>/dev/null || true
    
    # Prune system
    docker system prune -f
    
    echo "✅ Cleanup completed!"
}

# Main script logic
case "${1:-dev}" in
    "dev"|"development")
        deploy_dev
        ;;
    "prod"|"production")
        deploy_prod
        ;;
    "status")
        check_status
        ;;
    "logs")
        show_logs "${2:-dev}"
        ;;
    "cleanup")
        cleanup
        ;;
    "help"|"-h"|"--help")
        echo "Usage: $0 [command]"
        echo ""
        echo "Commands:"
        echo "  dev, development  - Deploy development environment (HTTP only)"
        echo "  prod, production  - Deploy production environment (HTTPS)"
        echo "  status           - Check deployment status"
        echo "  logs [env]       - Show logs (dev or prod)"
        echo "  cleanup          - Clean up Docker resources"
        echo "  help             - Show this help message"
        echo ""
        echo "Examples:"
        echo "  $0 dev           # Deploy development"
        echo "  $0 prod          # Deploy production"
        echo "  $0 logs prod     # Show production logs"
        ;;
    *)
        echo "❌ Unknown command: $1"
        echo "Use '$0 help' for usage information"
        exit 1
        ;;
esac
