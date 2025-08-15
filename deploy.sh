#!/bin/bash

echo "🚀 Deploying AuctionFlow Application..."

# Build and start services
echo "📦 Building Docker containers..."
docker-compose build

echo "🔄 Starting services..."
docker-compose up -d

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 30

# Check service status
echo "🔍 Checking service status..."
docker-compose ps

# Run database migrations
echo "🗄️ Running database migrations..."
docker-compose exec backend python manage.py migrate

# Create superuser if needed
echo "👤 Creating superuser..."
docker-compose exec backend python manage.py createsuperuser --noinput || echo "Superuser already exists"

# Check health
echo "🏥 Health check..."
curl -f http://localhost:8000/api/hello/ && echo "✅ Backend is healthy" || echo "❌ Backend health check failed"
curl -f http://localhost:3000 && echo "✅ Frontend is healthy" || echo "❌ Frontend health check failed"

echo "🎉 Deployment complete!"
echo "🌐 Frontend: http://localhost:3000"
echo "🔧 Backend API: http://localhost:8000/api/"
echo "🗄️ Database: localhost:5432"
echo ""
echo "📋 Useful commands:"
echo "  View logs: docker-compose logs -f"
echo "  Stop services: docker-compose down"
echo "  Restart: docker-compose restart"
echo "  Update: docker-compose pull && docker-compose up -d"
