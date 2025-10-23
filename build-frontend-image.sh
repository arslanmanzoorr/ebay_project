#!/bin/bash
# Build Frontend Docker Image Script (Ubuntu/Linux)
# This script builds a production-ready Docker image with all the latest changes

echo "========================================"
echo "  Building Bidsquire Frontend Image"
echo "========================================"
echo ""

# Set image name and tag
IMAGE_NAME="bidsquire-frontend"
IMAGE_TAG="latest"
FULL_IMAGE_NAME="${IMAGE_NAME}:${IMAGE_TAG}"

# Check if Docker is available
echo "Checking Docker installation..."
if ! command -v docker &> /dev/null; then
    echo "✗ Docker not found"
    echo "Please install Docker first"
    exit 1
fi

# Check if Docker is running
if ! docker ps &> /dev/null; then
    echo "✗ Docker is not running"
    echo "Please start Docker service: sudo systemctl start docker"
    exit 1
fi

echo "✓ Docker is running"
echo ""

echo "Building Docker image: $FULL_IMAGE_NAME"
echo "This may take 5-10 minutes..."
echo ""

# Build the Docker image
cd project
docker build -f Dockerfile.prod -t "$FULL_IMAGE_NAME" .

if [ $? -eq 0 ]; then
    echo ""
    echo "========================================"
    echo "  Build Successful!"
    echo "========================================"
    echo ""
    echo "Image Details:"
    echo "  - Name: $FULL_IMAGE_NAME"
    
    # Get image size
    IMAGE_SIZE=$(docker images "$IMAGE_NAME" --format "{{.Size}}" | head -n1)
    echo "  - Size: $IMAGE_SIZE"
    echo ""
    
    echo "Next Steps:"
    echo "  1. Save image: ./save-frontend-image.sh"
    echo "  2. Or deploy directly: docker-compose up -d frontend"
    echo ""
    echo "Test locally:"
    echo "  docker run -p 3000:3000 --env-file .env.local $FULL_IMAGE_NAME"
    echo ""
    echo "========================================"
else
    echo ""
    echo "========================================"
    echo "  Build Failed!"
    echo "========================================"
    echo ""
    echo "Please check the error messages above and fix any issues."
    exit 1
fi

cd ..

