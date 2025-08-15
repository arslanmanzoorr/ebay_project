#!/bin/bash

echo "🧪 Testing Docker setup..."

# Test if nginx directory exists
if [ ! -d "nginx" ]; then
    echo "❌ nginx directory not found!"
    exit 1
fi

# Test if nginx.conf exists
if [ ! -f "nginx/nginx.conf" ]; then
    echo "❌ nginx.conf not found!"
    exit 1
fi

# Test if conf.d directory exists
if [ ! -d "nginx/conf.d" ]; then
    echo "❌ nginx/conf.d directory not found!"
    exit 1
fi

# Test if app.conf exists
if [ ! -f "nginx/conf.d/app.conf" ]; then
    echo "❌ nginx/conf.d/app.conf not found!"
    exit 1
fi

# Test if ssl directory exists
if [ ! -d "ssl" ]; then
    echo "❌ ssl directory not found!"
    exit 1
fi

echo "✅ All required files exist!"

# Test Docker build for nginx
echo "🔨 Testing Nginx Docker build..."
cd nginx
docker build -t test-nginx . || {
    echo "❌ Nginx Docker build failed!"
    exit 1
}
cd ..

echo "✅ Nginx Docker build successful!"

# Clean up test image
docker rmi test-nginx

echo "🎉 All tests passed! Ready to deploy."
