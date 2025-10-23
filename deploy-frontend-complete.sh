#!/bin/bash
# Complete Frontend Deployment Script (Ubuntu/Linux)
# This script builds, stops old containers, and deploys the new frontend

echo "========================================"
echo "  Bidsquire Frontend Deployment"
echo "========================================"
echo ""

# Configuration
IMAGE_NAME="bidsquire-frontend"
IMAGE_TAG="latest"
FULL_IMAGE_NAME="${IMAGE_NAME}:${IMAGE_TAG}"
CONTAINER_NAME="bidsquire-frontend"

# Step 1: Check Docker
echo "Step 1: Checking Docker..."
if ! command -v docker &> /dev/null; then
    echo "✗ Docker not found"
    exit 1
fi

if ! docker ps &> /dev/null; then
    echo "✗ Docker is not running"
    exit 1
fi

echo "✓ Docker is running"

# Step 2: Stop existing containers
echo ""
echo "Step 2: Stopping existing containers..."
pm2 stop ebay-frontend 2>/dev/null || true
pm2 delete ebay-frontend 2>/dev/null || true
docker stop "$CONTAINER_NAME" 2>/dev/null || true
docker rm "$CONTAINER_NAME" 2>/dev/null || true
echo "✓ Old containers stopped"

# Step 3: Build the image
echo ""
echo "Step 3: Building Docker image..."
echo "This may take 5-10 minutes..."
echo ""

cd project
docker build -f Dockerfile.prod -t "$FULL_IMAGE_NAME" .
BUILD_STATUS=$?
cd ..

if [ $BUILD_STATUS -ne 0 ]; then
    echo ""
    echo "✗ Build failed"
    exit 1
fi

echo ""
echo "✓ Image built successfully"

# Step 4: Get database container name
echo ""
echo "Step 4: Detecting database container..."
DB_CONTAINER=$(docker ps --format "{{.Names}}" | grep -E "postgres|db" | head -n1)

if [ -z "$DB_CONTAINER" ]; then
    echo "✗ Database container not found"
    echo "Please start the database first"
    exit 1
fi

echo "✓ Found database container: $DB_CONTAINER"

# Step 5: Deploy the container
echo ""
echo "Step 5: Deploying frontend container..."

docker run -d --name "$CONTAINER_NAME" \
  -p 3000:3000 \
  -e DB_HOST=postgres \
  -e DB_PORT=5432 \
  -e DB_NAME=auctionflow \
  -e DB_USER=auctionuser \
  -e DB_PASSWORD=auctionpass \
  -e DB_SSL=false \
  -e NODE_ENV=production \
  --network ebay_project_default \
  --restart unless-stopped \
  "$FULL_IMAGE_NAME"

if [ $? -ne 0 ]; then
    echo "✗ Failed to start container"
    exit 1
fi

echo "✓ Container started successfully"

# Step 6: Wait for health check
echo ""
echo "Step 6: Waiting for frontend to be ready..."
for i in {1..30}; do
    if curl -f http://localhost:3000/api/health &> /dev/null; then
        echo "✓ Frontend is ready!"
        break
    fi
    echo -n "."
    sleep 2
done

echo ""

# Step 7: Verify deployment
echo ""
echo "Step 7: Verifying deployment..."
HEALTH_RESPONSE=$(curl -s http://localhost:3000/api/health)

if [ $? -eq 0 ]; then
    echo "✓ Health check passed"
    echo ""
    echo "========================================"
    echo "  Deployment Complete!"
    echo "========================================"
    echo ""
    echo "Frontend Information:"
    echo "  - URL: http://localhost:3000"
    echo "  - External: http://108.181.167.171:3000"
    echo "  - Container: $CONTAINER_NAME"
    echo "  - Image: $FULL_IMAGE_NAME"
    echo ""
    echo "Changes Included:"
    echo "  ✓ Bidsquire logo added"
    echo "  ✓ Duplicate buttons fixed"
    echo "  ✓ Database connection optimized"
    echo "  ✓ Production-ready"
    echo ""
    echo "Useful Commands:"
    echo "  - View logs: docker logs $CONTAINER_NAME"
    echo "  - Follow logs: docker logs -f $CONTAINER_NAME"
    echo "  - Stop: docker stop $CONTAINER_NAME"
    echo "  - Restart: docker restart $CONTAINER_NAME"
    echo ""
    echo "Test in browser:"
    echo "  http://108.181.167.171:3000"
    echo ""
    echo "========================================"
else
    echo "✗ Health check failed"
    echo ""
    echo "Check logs with: docker logs $CONTAINER_NAME"
    exit 1
fi

