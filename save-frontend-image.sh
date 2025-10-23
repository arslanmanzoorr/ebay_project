#!/bin/bash
# Save Frontend Docker Image to File (Ubuntu/Linux)
# This script saves the Docker image to a tar file for backup or transfer

echo "========================================"
echo "  Saving Bidsquire Frontend Image"
echo "========================================"
echo ""

# Set image name and output file
IMAGE_NAME="bidsquire-frontend:latest"
OUTPUT_FILE="bidsquire-frontend.tar"

echo "Saving image to: $OUTPUT_FILE"
echo "This may take a few minutes..."
echo ""

# Save the Docker image
docker save -o "$OUTPUT_FILE" "$IMAGE_NAME"

if [ $? -eq 0 ]; then
    FILE_SIZE=$(du -h "$OUTPUT_FILE" | cut -f1)
    
    echo ""
    echo "========================================"
    echo "  Image Saved Successfully!"
    echo "========================================"
    echo ""
    echo "File Details:"
    echo "  - Location: $(pwd)/$OUTPUT_FILE"
    echo "  - Size: $FILE_SIZE"
    echo ""
    echo "Next Steps:"
    echo "  1. Transfer to another server (if needed):"
    echo "     scp $OUTPUT_FILE user@server:~/"
    echo ""
    echo "  2. Load the image (on target server):"
    echo "     docker load -i $OUTPUT_FILE"
    echo ""
    echo "  3. Deploy with docker-compose:"
    echo "     docker-compose up -d frontend"
    echo ""
    echo "========================================"
else
    echo ""
    echo "✗ Failed to save image"
    exit 1
fi

