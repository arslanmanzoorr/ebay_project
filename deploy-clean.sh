#!/bin/bash

echo "🧹 Starting clean deployment process..."

# Step 1: Nuclear Docker cleanup
echo "🔥 Nuclear Docker cleanup..."
docker-compose -f docker-compose.prod.yml down --volumes --remove-orphans 2>/dev/null || true
docker container prune -f
docker image prune -a -f
docker volume prune -f
docker network prune -f
docker system prune -a --volumes --force
docker rmi $(docker images -q ebay_project*) 2>/dev/null || true

# Step 2: Clean up host files
echo "🧽 Cleaning up host files..."
sudo rm -f ./project/webhook_data.db
sudo chown -R ubuntu:ubuntu ./project/ 2>/dev/null || sudo chown -R $USER:$USER ./project/
sudo chmod -R 755 ./project/

# Ensure uploads directory exists with correct permissions
mkdir -p ./project/public/uploads
sudo chown -R ubuntu:ubuntu ./project/public/uploads 2>/dev/null || sudo chown -R $USER:$USER ./project/public/uploads
sudo chmod -R 755 ./project/public/uploads

# Step 3: Build and deploy
echo "🚀 Building and deploying..."
docker-compose -f docker-compose.prod.yml build --no-cache
docker-compose -f docker-compose.prod.yml up -d

# Step 4: Check status
echo "📊 Checking deployment status..."
sleep 10
docker-compose -f docker-compose.prod.yml ps
docker-compose -f docker-compose.prod.yml logs frontend --tail=20

echo "✅ Clean deployment complete!"
echo "🌐 Your app should be available at: http://your-server-ip"
echo "👤 Default admin login: admin@example.com / admin123"
