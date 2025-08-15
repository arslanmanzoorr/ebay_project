#!/bin/bash

# Production Deployment Script for AuctionFlow
set -e

echo "🚀 Starting production deployment..."

# Check if .env.prod exists
if [ ! -f .env.prod ]; then
    echo "❌ Error: .env.prod file not found!"
    echo ""
    echo "📝 Please create .env.prod file from the template:"
    echo "   cp env.prod.template .env.prod"
    echo ""
    echo "🔧 Then edit .env.prod and update the values:"
    echo "   nano .env.prod"
    echo ""
    echo "⚠️  IMPORTANT: Change these default values:"
    echo "   - SECRET_KEY (generate a new one)"
    echo "   - POSTGRES_PASSWORD (use a strong password)"
    echo "   - ADMIN_PASSWORD (use a secure password)"
    exit 1
fi

# Load environment variables (ignore comments and empty lines)
echo "📋 Loading environment variables..."
while IFS= read -r line; do
    # Skip empty lines and comments
    if [[ -n "$line" && ! "$line" =~ ^[[:space:]]*# ]]; then
        # Extract key=value pairs
        if [[ "$line" =~ ^([^=]+)=(.*)$ ]]; then
            key="${BASH_REMATCH[1]}"
            value="${BASH_REMATCH[2]}"
            # Remove leading/trailing whitespace
            key=$(echo "$key" | xargs)
            value=$(echo "$value" | xargs)
            export "$key=$value"
            echo "   ✅ Loaded: $key"
        fi
    fi
done < .env.prod

# Verify critical variables
if [ -z "$SECRET_KEY" ] || [ -z "$POSTGRES_PASSWORD" ] || [ -z "$ADMIN_PASSWORD" ]; then
    echo "❌ Error: Missing required environment variables!"
    echo "Please check your .env.prod file"
    exit 1
fi

# Generate secure secret key if not set
if [ "$SECRET_KEY" = "your-super-secret-key-change-this-in-production" ]; then
    echo "⚠️  Warning: Using default SECRET_KEY. Please change this in production!"
fi

# Check admin credentials
if [ "$ADMIN_USERNAME" = "auctionflow_admin" ] && [ "$ADMIN_PASSWORD" = "AuCtIoNfLoW_2024_S3cur3!" ]; then
    echo "⚠️  Warning: Using default admin credentials. Please change these in production!"
fi

# Stop existing containers
echo "🛑 Stopping existing containers..."
docker-compose down

# Remove old images
echo "🧹 Cleaning up old images..."
docker system prune -f

# Build and start services
echo "🔨 Building and starting production services..."
docker-compose up --build -d

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 30

# Check service health
echo "🏥 Checking service health..."
docker-compose ps

# Run Django migrations
echo "🗄️  Running database migrations..."
docker-compose exec backend python manage.py migrate

# Create superuser with secure credentials
echo "👤 Creating superuser with secure credentials..."
docker-compose exec -T backend python manage.py createsuperuser --username "$ADMIN_USERNAME" --email "$ADMIN_EMAIL" --noinput || echo "Superuser already exists"

# Set admin password securely
echo "🔐 Setting secure admin password..."
docker-compose exec -T backend python manage.py shell -c "
from django.contrib.auth.models import User
try:
    user = User.objects.get(username='$ADMIN_USERNAME')
    user.set_password('$ADMIN_PASSWORD')
    user.save()
    print('Admin password updated successfully')
except User.DoesNotExist:
    print('Admin user not found')
"

# Collect static files
echo "📁 Collecting static files..."
docker-compose exec backend python manage.py collectstatic --noinput

echo "✅ Production deployment completed successfully!"
echo ""
echo "🌐 Your application is now running at:"
echo "   Frontend: http://localhost:3000"
echo "   Backend API: http://localhost:8000/api"
echo "   Admin: http://localhost:8000/admin"
echo "   Nginx: http://localhost:80"
echo ""
echo "🔐 Admin Login Credentials:"
echo "   Username: $ADMIN_USERNAME"
echo "   Email: $ADMIN_EMAIL"
echo "   Password: $ADMIN_PASSWORD"
echo ""
echo "📊 To view logs: docker-compose logs -f"
echo "🛑 To stop: docker-compose down"
echo ""
echo "⚠️  IMPORTANT: Change admin password after first login!"
