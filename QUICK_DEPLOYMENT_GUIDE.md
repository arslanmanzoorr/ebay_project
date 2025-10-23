# Quick Deployment Guide - Ubuntu Server

## ⚠️ Important: Understanding Docker Containers

**Docker containers are IMMUTABLE** - they contain a snapshot of your code from when they were built.

- **Restarting** a container = Same old code, just restart the process
- **Rebuilding** a container = New code changes included

---

## 🎯 Your Situation

You made these changes on your PC:
- ✅ Added Bidsquire logo
- ✅ Fixed duplicate buttons
- ✅ Updated branding

**These changes are currently:**
- ✅ On your Windows PC (in the code)
- ❌ NOT on the Ubuntu server yet
- ❌ NOT in the running container

---

## 🚀 Deployment Options

### Option 1: Quick Restart (NO new changes)

**When to use:** Container crashed, need to restart
**Result:** Same old code, no Bidsquire changes

```bash
# On Ubuntu server
docker restart <container-name>
```

### Option 2: Deploy New Changes (RECOMMENDED)

**When to use:** You have code changes to deploy
**Result:** All new changes included (Bidsquire logo, bug fixes, etc.)

**Steps:**

#### A. Push Code to Git (on Windows PC)
```powershell
git add .
git commit -m "Added Bidsquire branding and bug fixes"
git push
```

#### B. Pull and Rebuild on Server
```bash
# SSH into server
ssh administrator@108.181.167.171

# Navigate to project
cd ~/bidsquire/ebay_project

# Pull latest code
git pull

# Stop old container
docker-compose down frontend

# Rebuild with new code
cd project
docker build -f Dockerfile.prod -t bidsquire-frontend:latest .

# Start new container
cd ..
docker-compose up -d frontend

# Or run directly
docker run -d --name bidsquire-frontend \
  -p 3000:3000 \
  -e DB_HOST=postgres \
  -e DB_PORT=5432 \
  -e DB_NAME=auctionflow \
  -e DB_USER=auctionuser \
  -e DB_PASSWORD=auctionpass \
  --network ebay_project_default \
  --restart unless-stopped \
  bidsquire-frontend:latest

# Check logs
docker logs -f bidsquire-frontend
```

---

## 📋 Complete Ubuntu Deployment Commands

### Step 1: Prepare on Windows PC

```powershell
# Commit and push your changes
cd D:\Work\ebay_project\ebay_project
git add .
git commit -m "Bidsquire branding and bug fixes"
git push origin main
```

### Step 2: Deploy on Ubuntu Server

```bash
# SSH into server
ssh administrator@108.181.167.171

# Stop existing services
pm2 stop ebay-frontend 2>/dev/null || true
pm2 delete ebay-frontend 2>/dev/null || true
docker stop bidsquire-frontend 2>/dev/null || true
docker rm bidsquire-frontend 2>/dev/null || true

# Pull latest code
cd ~/bidsquire/ebay_project
git pull origin main

# Build new image
cd project
docker build -f Dockerfile.prod -t bidsquire-frontend:latest .

# Start container
docker run -d --name bidsquire-frontend \
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
  bidsquire-frontend:latest

# Wait for startup
echo "Waiting for frontend to start..."
sleep 10

# Test health
curl http://localhost:3000/api/health

# View logs
docker logs -f bidsquire-frontend
```

### Step 3: Verify Deployment

Open browser and check:
- `http://108.181.167.171:3000`
- Should see Bidsquire logo
- Should see no duplicate buttons

---

## 🔧 Useful Commands

### Check Status
```bash
# Check if container is running
docker ps | grep bidsquire

# Check container logs
docker logs bidsquire-frontend

# Follow logs in real-time
docker logs -f bidsquire-frontend

# Check health
curl http://localhost:3000/api/health
```

### Troubleshooting
```bash
# Container won't start?
docker logs bidsquire-frontend

# Database not connecting?
docker exec bidsquire-frontend ping postgres

# Port already in use?
sudo lsof -i :3000

# Restart database if needed
docker restart ebay_project_postgres_1
```

### Quick Restart (same code)
```bash
# Just restart existing container
docker restart bidsquire-frontend
```

### Full Rebuild (new changes)
```bash
# Stop and remove old container
docker stop bidsquire-frontend
docker rm bidsquire-frontend

# Rebuild image
cd ~/bidsquire/ebay_project/project
docker build -f Dockerfile.prod -t bidsquire-frontend:latest .

# Start new container
docker run -d --name bidsquire-frontend \
  -p 3000:3000 \
  -e DB_HOST=postgres \
  --network ebay_project_default \
  bidsquire-frontend:latest
```

---

## 📊 What's Running?

```bash
# Check all containers
docker ps

# Check database
docker ps | grep postgres

# Check frontend
docker ps | grep bidsquire

# Check PM2 processes
pm2 list

# Check network
docker network ls
```

---

## ✅ Final Checklist

After deployment, verify:

- [ ] Container is running: `docker ps | grep bidsquire`
- [ ] Health check passes: `curl http://localhost:3000/api/health`
- [ ] Can access frontend: `curl http://108.181.167.171:3000`
- [ ] Bidsquire logo appears on main page
- [ ] No duplicate buttons on admin page
- [ ] Database connection works
- [ ] Can login with admin credentials

---

## 🆘 Quick Fix Commands

### Container crashed?
```bash
docker restart bidsquire-frontend
```

### Need to rebuild with new changes?
```bash
cd ~/bidsquire/ebay_project
git pull
cd project
docker build -f Dockerfile.prod -t bidsquire-frontend:latest .
docker stop bidsquire-frontend && docker rm bidsquire-frontend
docker run -d --name bidsquire-frontend -p 3000:3000 -e DB_HOST=postgres --network ebay_project_default bidsquire-frontend:latest
```

### Database not responding?
```bash
docker restart ebay_project_postgres_1
```

### Clear everything and start fresh?
```bash
docker stop bidsquire-frontend ebay_project_postgres_1
docker rm bidsquire-frontend ebay_project_postgres_1
docker-compose up -d
```

---

**Remember:** To get your new Bidsquire changes on the server, you MUST rebuild the container, not just restart it!

