#!/bin/bash

# 🚀 Bidsquire Auction Platform - One-Command Deployment
# Just run this script after setting up your .env file and relax!

set -e  # Exit on any error

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}"
echo "🚀 Bidsquire Auction Platform - Easy Deployment"
echo "=============================================="
echo -e "${NC}"

# Check if .env file exists
if [ ! -f ".env" ] && [ ! -f ".env.production" ]; then
    echo -e "${RED}❌ No environment file found!${NC}"
    echo "Please create .env file first:"
    echo "  cp env.example .env"
    echo "  # Edit .env with your settings"
    echo "  # Then run this script again"
    exit 1
fi

# Determine environment
if [ -f ".env.production" ]; then
    ENV_FILE=".env.production"
    COMPOSE_FILE="docker-compose.prod.yml"
    echo -e "${YELLOW}📋 Using production environment${NC}"
else
    ENV_FILE=".env"
    COMPOSE_FILE="docker-compose.yml"
    echo -e "${YELLOW}📋 Using development environment${NC}"
fi

echo -e "${BLUE}🔍 Checking Docker...${NC}"
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running!${NC}"
    echo "Please start Docker Desktop and try again."
    exit 1
fi
echo -e "${GREEN}✅ Docker is running${NC}"

echo -e "${BLUE}🧹 Cleaning up old containers...${NC}"
docker-compose -f "$COMPOSE_FILE" down --remove-orphans 2>/dev/null || true

echo -e "${BLUE}🔨 Building images...${NC}"
docker-compose -f "$COMPOSE_FILE" build --no-cache

echo -e "${BLUE}🚀 Starting services...${NC}"
docker-compose -f "$COMPOSE_FILE" up -d

echo -e "${BLUE}⏳ Waiting for services to start...${NC}"
sleep 15

echo -e "${BLUE}🗄️ Initializing database...${NC}"
# Wait for database
for i in {1..30}; do
    if docker-compose -f "$COMPOSE_FILE" exec -T postgres pg_isready -U auctionuser -d auctionflow > /dev/null 2>&1; then
        break
    fi
    echo -e "${YELLOW}   Waiting for database... ($i/30)${NC}"
    sleep 2
done

# Run migrations
docker-compose -f "$COMPOSE_FILE" exec -T backend python manage.py migrate 2>/dev/null || true

# Create admin user
echo -e "${BLUE}👤 Creating admin user...${NC}"
docker-compose -f "$COMPOSE_FILE" exec -T frontend node scripts/init-admin.js 2>/dev/null || true

echo -e "${BLUE}🔍 Checking health...${NC}"
sleep 5

# Check if services are running
if docker-compose -f "$COMPOSE_FILE" ps | grep -q "Up"; then
    echo -e "${GREEN}✅ All services are running!${NC}"
else
    echo -e "${RED}❌ Some services failed to start${NC}"
    echo "Check logs with: docker-compose -f $COMPOSE_FILE logs"
    exit 1
fi

echo ""
echo -e "${GREEN}🎉 DEPLOYMENT COMPLETE! 🎉${NC}"
echo "=================================="
echo ""
echo -e "${BLUE}🌐 Your app is now running at:${NC}"
echo "   Frontend: http://localhost:3000"
echo "   Admin:    http://localhost:3000/admin"
echo "   API:      http://localhost:3000/api/health"
echo ""
echo -e "${BLUE}🔑 Admin Login:${NC}"
echo "   Check your $ENV_FILE file for ADMIN_EMAIL and ADMIN_PASSWORD"
echo ""
echo -e "${BLUE}📊 Management:${NC}"
echo "   View logs: docker-compose -f $COMPOSE_FILE logs -f"
echo "   Stop app:  docker-compose -f $COMPOSE_FILE down"
echo "   Restart:   docker-compose -f $COMPOSE_FILE restart"
echo ""
echo -e "${GREEN}🚀 Enjoy your auction platform!${NC}"
