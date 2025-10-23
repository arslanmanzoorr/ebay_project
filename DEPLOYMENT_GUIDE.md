# Bidsquire Frontend Deployment Guide

Complete guide for deploying the containerized Bidsquire frontend to your Ubuntu server.

---

## 🎯 What's New in This Build

This containerized frontend includes all the latest changes:

✅ **Bidsquire Branding**
- Logo added to navbar, login page, and main landing page
- All "AuctionFlow" references updated to "Bidsquire"

✅ **Bug Fixes**
- Duplicate "Create eBay Draft" buttons removed from admin page
- View Original Listing button code verified and working

✅ **Infrastructure Improvements**
- Database configuration now uses environment variables
- Production-ready Docker image with health checks
- Optimized for server deployment

---

## 📋 Prerequisites

### On Windows PC:
- Docker Desktop installed on E:\Docker
- PowerShell with execution policy allowing scripts
- SSH access to server (optional for manual transfer)

### On Ubuntu Server:
- Docker installed and running
- Docker Compose installed
- PostgreSQL database container running
- Ports 3000 available

---

## 🚀 Deployment Methods

### Method 1: Automated Build and Deploy (Recommended)

**On Windows PC:**

```powershell
# Run the complete deployment script
.\deploy-frontend-to-server.ps1
```

This script will:
1. Build the Docker image with all new changes
2. Save it to a tar file
3. Provide deployment instructions

---

### Method 2: Step-by-Step Manual Deployment

#### Step 1: Build the Docker Image

```powershell
# On Windows PC
.\build-frontend-image.ps1
```

**Output:**
- Image Name: `bidsquire-frontend:latest`
- Build Time: 5-10 minutes
- Final Size: ~500-700 MB

#### Step 2: Save Image to File

```powershell
# On Windows PC
.\save-frontend-image.ps1
```

**Output:**
- File: `bidsquire-frontend.tar`
- Size: ~500-700 MB

#### Step 3: Transfer to Server

**Option A: Using SCP (if you have SSH client)**
```powershell
scp bidsquire-frontend.tar administrator@108.181.167.171:~/
```

**Option B: Using WinSCP or FileZilla**
1. Open WinSCP/FileZilla
2. Connect to: `108.181.167.171`
3. User: `administrator`
4. Upload `bidsquire-frontend.tar` to `/home/administrator/`

#### Step 4: Deploy on Server

**SSH into server:**
```bash
ssh administrator@108.181.167.171
```

**Stop existing frontend:**
```bash
cd ~/bidsquire/ebay_project
pm2 stop ebay-frontend 2>/dev/null
pm2 delete ebay-frontend 2>/dev/null
```

**Load the new image:**
```bash
docker load -i ~/bidsquire-frontend.tar
```

**Start the container:**
```bash
# Option A: Using docker-compose (recommended)
cd ~/bidsquire/ebay_project
docker-compose down frontend 2>/dev/null
docker-compose up -d frontend

# Option B: Using docker run directly
docker stop bidsquire-frontend 2>/dev/null
docker rm bidsquire-frontend 2>/dev/null

docker run -d --name bidsquire-frontend \
  -p 3000:3000 \
  -e DB_HOST=postgres \
  -e DB_PORT=5432 \
  -e DB_NAME=auctionflow \
  -e DB_USER=auctionuser \
  -e DB_PASSWORD=auctionpass \
  -e DB_SSL=false \
  --network ebay_project_default \
  bidsquire-frontend:latest
```

---

## ✅ Verification

### Check Container Status

```bash
# List running containers
docker ps | grep bidsquire

# Check container logs
docker logs bidsquire-frontend

# Follow logs in real-time
docker logs -f bidsquire-frontend
```

### Test Health Endpoint

```bash
# From server
curl http://localhost:3000/api/health

# From external
curl http://108.181.167.171:3000/api/health
```

**Expected Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-10-23T...",
  "uptime": 123.456,
  "environment": "production",
  "version": "0.1.0"
}
```

### Test Frontend Access

Open browser and navigate to:
- `http://108.181.167.171:3000`

You should see:
- Bidsquire logo in the navbar
- Login page with Bidsquire branding
- No duplicate buttons on admin page

---

## 🔧 Troubleshooting

### Container Won't Start

```bash
# Check container logs
docker logs bidsquire-frontend

# Check if port is already in use
sudo lsof -i :3000

# Check if database is accessible
docker exec bidsquire-frontend ping postgres
```

### Database Connection Issues

```bash
# Verify database is running
docker ps | grep postgres

# Test database connection
docker exec -it bidsquire-frontend sh
ping postgres
exit
```

### Image Loading Failed

```bash
# Check if tar file exists
ls -lh ~/bidsquire-frontend.tar

# Check Docker disk space
docker system df

# Clean up old images if needed
docker image prune -a
```

---

## 🔄 Updating the Frontend

When you have new changes:

1. **On Windows PC:**
   ```powershell
   .\deploy-frontend-to-server.ps1
   ```

2. **Transfer new tar file to server**

3. **On Server:**
   ```bash
   docker stop bidsquire-frontend
   docker rm bidsquire-frontend
   docker rmi bidsquire-frontend:latest
   docker load -i ~/bidsquire-frontend.tar
   docker run -d --name bidsquire-frontend \
     -p 3000:3000 \
     -e DB_HOST=postgres \
     --network ebay_project_default \
     bidsquire-frontend:latest
   ```

---

## 📊 Docker Compose Configuration

For `docker-compose.yml`, update the frontend service:

```yaml
  frontend:
    image: bidsquire-frontend:latest
    # Remove the 'build' section
    ports:
      - "3000:3000"
    environment:
      - DB_HOST=postgres
      - DB_PORT=5432
      - DB_NAME=auctionflow
      - DB_USER=auctionuser
      - DB_PASSWORD=auctionpass
      - DB_SSL=false
      - NODE_ENV=production
    depends_on:
      - db
    networks:
      - default
    restart: unless-stopped
```

---

## 🌐 Environment Variables

The containerized frontend uses these environment variables:

| Variable | Default | Description |
|----------|---------|-------------|
| `DB_HOST` | `localhost` | Database host |
| `DB_PORT` | `5432` | Database port |
| `DB_NAME` | `auctionflow` | Database name |
| `DB_USER` | `auctionuser` | Database user |
| `DB_PASSWORD` | `auctionpass` | Database password |
| `DB_SSL` | `false` | Enable SSL for database |
| `NODE_ENV` | `production` | Node environment |
| `PORT` | `3000` | Frontend port |

---

## 📝 Quick Reference Commands

### Windows PC
```powershell
# Build image
.\build-frontend-image.ps1

# Save image
.\save-frontend-image.ps1

# Complete deployment
.\deploy-frontend-to-server.ps1

# Check Docker
E:\Docker\resources\bin\docker.exe ps
```

### Ubuntu Server
```bash
# Check containers
docker ps

# View logs
docker logs bidsquire-frontend

# Restart container
docker restart bidsquire-frontend

# Stop and remove
docker stop bidsquire-frontend
docker rm bidsquire-frontend

# Check database
docker exec -it ebay_project_postgres_1 psql -U auctionuser -d auctionflow
```

---

## 🆘 Support

If you encounter issues:

1. Check container logs: `docker logs bidsquire-frontend`
2. Verify database is running: `docker ps | grep postgres`
3. Test health endpoint: `curl http://localhost:3000/api/health`
4. Check network connectivity: `docker network ls`

---

**Last Updated:** October 23, 2025  
**Version:** 2.0  
**Build:** Bidsquire Production Release
