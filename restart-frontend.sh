#!/bin/bash
# Restart Frontend Container (Ubuntu/Linux)
# This script restarts the existing frontend container

echo "========================================"
echo "  Restarting Bidsquire Frontend"
echo "========================================"
echo ""

# Find the frontend container
CONTAINER_NAME=$(docker ps -a --format "{{.Names}}" | grep -E "frontend|bidsquire" | head -n1)

if [ -z "$CONTAINER_NAME" ]; then
    echo "✗ No frontend container found"
    echo ""
    echo "Available containers:"
    docker ps -a --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
    exit 1
fi

echo "Found container: $CONTAINER_NAME"
echo ""

# Restart the container
echo "Restarting container..."
docker restart "$CONTAINER_NAME"

if [ $? -eq 0 ]; then
    echo "✓ Container restarted successfully"
    
    # Wait for it to be ready
    echo ""
    echo "Waiting for frontend to be ready..."
    for i in {1..30}; do
        if curl -f http://localhost:3000/api/health &> /dev/null; then
            echo "✓ Frontend is ready!"
            break
        fi
        echo -n "."
        sleep 2
    done
    
    echo ""
    echo ""
    echo "========================================"
    echo "  Restart Complete!"
    echo "========================================"
    echo ""
    echo "Frontend Information:"
    echo "  - URL: http://localhost:3000"
    echo "  - External: http://108.181.167.171:3000"
    echo "  - Container: $CONTAINER_NAME"
    echo ""
    echo "Useful Commands:"
    echo "  - View logs: docker logs $CONTAINER_NAME"
    echo "  - Follow logs: docker logs -f $CONTAINER_NAME"
    echo "  - Check status: docker ps | grep $CONTAINER_NAME"
    echo ""
    echo "Test in browser:"
    echo "  http://108.181.167.171:3000"
    echo ""
    echo "========================================"
else
    echo "✗ Failed to restart container"
    exit 1
fi

