#!/bin/bash

# Production Deployment Script for AuctionFlow
set -e

echo "🚀 Starting production deployment..."

# Check if .env.prod exists
if [ ! -f .env.prod ]; then
    echo "❌ Error: .env.prod file not found!"
    echo "Please copy env.prod.template to .env.prod and update the values"
    exit 1
fi

# Load environment variables
export $(cat .env.prod | xargs)

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
docker-compose -f docker-compose.prod.yml down

# Remove old images
echo "🧹 Cleaning up old images..."
docker system prune -f

# Build and start services
echo "🔨 Building and starting production services..."
docker-compose -f docker-compose.prod.yml up --build -d

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 30

# Check service health
echo "🏥 Checking service health..."
docker-compose -f docker-compose.prod.yml ps

# Run Django migrations
echo "🗄️  Running database migrations..."
docker-compose -f docker-compose.prod.yml exec backend python manage.py migrate

# Create superuser with secure credentials
echo "👤 Creating superuser with secure credentials..."
docker-compose -f docker-compose.prod.yml exec -T backend python manage.py createsuperuser --username "$ADMIN_USERNAME" --email "$ADMIN_EMAIL" --noinput || echo "Superuser already exists"

# Set admin password securely
echo "🔐 Setting secure admin password..."
docker-compose -f docker-compose.prod.yml exec -T backend python manage.py shell -c "
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
docker-compose -f docker-compose.prod.yml exec backend python manage.py collectstatic --noinput

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
echo "📊 To view logs: docker-compose -f docker-compose.prod.yml logs -f"
echo "🛑 To stop: docker-compose -f docker-compose.prod.yml down"
echo ""
echo "⚠️  IMPORTANT: Change admin password after first login!"
