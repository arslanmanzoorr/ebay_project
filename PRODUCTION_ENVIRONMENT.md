# Bidsquire Production Environment Documentation

**Last Updated**: April 15, 2026  
**Server**: 108.181.167.171

## Overview

The Bidsquire platform consists of three separate applications:

| Application | Domain | Hosting | Database |
|-------------|--------|---------|----------|
| Main App (ebay_project) | app.bidsquire.com | Server 108.181.167.171 (Docker) | PostgreSQL (Docker) |
| Onboarding | onboarding.bidsquire.com | Vercel | Neon PostgreSQL |
| Marketing/Landing | www.bidsquire.com | GCP Cloud Run | None |

---

## Main App (ebay_project) - Server Details

### SSH Access

```bash
ssh administrator@108.181.167.171
# Password: BqSrv!2026#Atif#9XqL
```

### Docker Containers Running

| Container | Image | Port Mapping | Status |
|-----------|-------|--------------|--------|
| bidsquire-frontend-1 | bidsquire-frontend | 3001:3000 | Healthy |
| bidsquire-backend-1 | bidsquire-backend | 8000:8000 | Running |
| bidsquire-db-1 | postgres:15-alpine | 5435:5432 | Healthy |
| bidsquire-redis-1 | redis:7-alpine | 6379:6379 | Healthy |

### Database Configuration

**IMPORTANT**: The app runs via Docker Compose, NOT PM2 (the deployment_commands.md file is outdated).

| Setting | Value |
|---------|-------|
| Host (internal) | `db` (Docker network) |
| Host (external) | `localhost` |
| Port (internal) | 5432 |
| Port (external) | 5435 |
| Database | auctionflow |
| User | auctionuser |
| Password | `auctionpass` |

### Database Tables

- users (17 records)
- auction_items
- workflow_steps
- notifications
- webhook_data
- user_credits
- credit_batches
- credit_transactions
- credit_settings
- password_reset_tokens
- organizations

### Default Admin Accounts

| Name | Email | Role |
|------|-------|------|
| Bidsquire Admin | admin@bidsquire.com | admin |
| Bidsquire Super Admin | superadmin@bidsquire.com | super_admin |

---

## Deployment Commands

### Deploy Code Updates

```bash
# SSH into server
ssh administrator@108.181.167.171

# Navigate to project
cd ~/bidsquire/ebay_project

# Pull latest code
git pull origin main

# Rebuild and restart containers
docker-compose down
docker-compose up -d --build

# OR just restart without rebuild
docker-compose restart frontend
```

### Database Commands

```bash
# Connect to database
docker exec -it bidsquire-db-1 psql -U auctionuser -d auctionflow

# Check database health
docker exec bidsquire-db-1 pg_isready -U auctionuser -d auctionflow

# View container logs
docker logs bidsquire-db-1
docker logs bidsquire-frontend-1

# Check all containers
docker ps -a
```

### Backup Database

```bash
# Use the backup script (recommended)
~/bidsquire/backup-database.sh

# Or manual backup
docker exec bidsquire-db-1 pg_dump -U auctionuser auctionflow > ~/backups/auctionflow_$(date +%Y%m%d_%H%M%S).sql
```

The backup script:
- Creates timestamped backups in `~/backups/`
- Automatically keeps only the last 7 backups
- Shows backup size after completion

### Restore Database

```bash
# Use the restore script
~/bidsquire/restore-database.sh ~/backups/auctionflow_YYYYMMDD_HHMMSS.sql

# List available backups
ls -la ~/backups/
```

**WARNING**: Restore will replace all current data. The script will ask for confirmation.

### Setup Automated Backups (Optional)

```bash
# Add to crontab for daily backups at 2 AM
crontab -e
# Add this line:
0 2 * * * /home/administrator/bidsquire/backup-database.sh >> /home/administrator/backups/backup.log 2>&1
```

---

## Environment Files

### Server .env (~/bidsquire/ebay_project/.env)

```
POSTGRES_DB=auctionflow
POSTGRES_USER=auctionuser
POSTGRES_PASSWORD=auctionpass
POSTGRES_HOST=postgres
POSTGRES_PORT=5432
ADMIN_NAME=Bidsquire Admin
ADMIN_EMAIL=admin@bidsquire.com
ADMIN_PASSWORD=Admin@bids25
NEXT_PUBLIC_API_URL=http://localhost:3000/api
NODE_ENV=production
SECRET_KEY=your-super-secret-django-key-here-change-this-in-production
ALLOWED_HOSTS=app.bidsquire.com,localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=https://app.bidsquire.com,http://localhost:3000

# Cross-App Communication (CRITICAL for signup flow!)
CROSS_APP_SECRET=temporary-dev-secret-change-me
ONBOARDING_APP_URL=https://onboarding.bidsquire.com

# Email Service (Resend - for password reset emails)
RESEND_API_KEY=re_S6NpMiHy_H4kSHmHckDvTNZqLGrMPzWc9
NEXT_PUBLIC_APP_URL=https://app.bidsquire.com
```

**IMPORTANT**: 
- The `CROSS_APP_SECRET` must match between the Onboarding app (Vercel) and the Main app (Server) for user activation to work.
- The `RESEND_API_KEY` is required for password reset emails to work.

---

## Cross-App Communication

### Onboarding → Main App

The onboarding app communicates with the main app using:

1. **CROSS_APP_SECRET**: HMAC token signing for secure communication
2. **MAIN_APP_URL**: `https://app.bidsquire.com`

API endpoints used:
- `POST /api/internal/provision-trial` - Creates trial users
- `GET /auth/activate?token=...` - User activation

### Environment Variables to Sync

Both apps must have matching `CROSS_APP_SECRET` values.

---

## Troubleshooting

### App Not Responding

```bash
# Check container status
docker ps -a

# Check logs
docker logs bidsquire-frontend-1 --tail 100
docker logs bidsquire-backend-1 --tail 100

# Restart all services
docker-compose restart
```

### Database Connection Issues

```bash
# Test database connection
docker exec bidsquire-db-1 pg_isready -U auctionuser -d auctionflow

# Check database logs
docker logs bidsquire-db-1 --tail 100

# Verify user count
docker exec bidsquire-db-1 psql -U auctionuser -d auctionflow -c 'SELECT COUNT(*) FROM users;'
```

### Container Won't Start

```bash
# View detailed logs
docker-compose logs

# Rebuild specific container
docker-compose up -d --build frontend

# Full rebuild
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

---

## Important Notes

1. **PM2 is NOT used** - The deployment_commands.md file references PM2, but the actual deployment uses Docker Compose.

2. **Database Port** - External access is on port 5435, not 5432. Internal Docker network uses 5432.

3. **Password Discrepancy** - Local files may show `AuctionFlow2024!` but the actual server uses `auctionpass`.

4. **Nginx** - The production setup may include Nginx reverse proxy. Check `nginx/` folder for configuration.

---

## Step-by-Step Deployment Guide

### Scenario 1: Deploy Code Changes (Standard Deployment)

When you make changes locally and push to the main branch:

```bash
# Step 1: SSH into server
ssh administrator@108.181.167.171
# Password: BqSrv!2026#Atif#9XqL

# Step 2: Navigate to project
cd ~/bidsquire/ebay_project

# Step 3: Pull latest code
git pull origin main

# Step 4: Rebuild and restart frontend (most common case)
docker-compose build --no-cache frontend
docker stop ebay_project_frontend_1
docker rm ebay_project_frontend_1
docker-compose up -d frontend

# Step 5: Verify deployment
docker ps
docker logs ebay_project_frontend_1 --tail 20
```

### Scenario 2: Clean Build (When Cache Causes Issues)

If you see stale code or the build has issues:

```bash
# Step 1: SSH and navigate
ssh administrator@108.181.167.171
cd ~/bidsquire/ebay_project

# Step 2: Pull latest code
git pull origin main

# Step 3: Stop all containers
docker-compose down

# Step 4: Remove old images (clears cache)
docker rmi ebay_project_frontend --force
docker rmi ebay_project_backend --force

# Step 5: Rebuild everything from scratch
docker-compose build --no-cache

# Step 6: Start all containers
docker-compose up -d

# Step 7: Verify everything is running
docker ps
```

### Scenario 3: Full Reset (Nuclear Option)

Use this only if everything is broken:

```bash
# Step 1: Backup database first!
~/bidsquire/backup-database.sh

# Step 2: Stop and remove everything
cd ~/bidsquire/ebay_project
docker-compose down -v --remove-orphans

# Step 3: Remove all project images
docker images | grep ebay_project | awk '{print $3}' | xargs docker rmi -f

# Step 4: Pull fresh code
git fetch origin
git reset --hard origin/main

# Step 5: Rebuild and start
docker-compose build --no-cache
docker-compose up -d

# Step 6: Verify database (data persists in named volume)
docker exec ebay_project_db_1 psql -U auctionuser -d auctionflow -c 'SELECT COUNT(*) FROM users;'
```

### Scenario 4: Adding New Environment Variables

When you add new env vars to the code:

```bash
# Step 1: SSH and navigate
ssh administrator@108.181.167.171
cd ~/bidsquire/ebay_project

# Step 2: Add variables to .env file
echo 'NEW_VARIABLE=value' >> .env

# Step 3: Update docker-compose.yml to pass the variable
# Add under frontend > environment:
#   - NEW_VARIABLE=${NEW_VARIABLE}

# Step 4: Recreate frontend container
docker stop ebay_project_frontend_1
docker rm ebay_project_frontend_1
docker-compose up -d frontend

# Step 5: Verify the variable is set
docker exec ebay_project_frontend_1 printenv | grep NEW_VARIABLE
```

### Database Considerations

**The database persists independently** - Your data is safe even when rebuilding containers.

- Database data is stored in a Docker volume (`postgres_data`)
- Rebuilding frontend/backend does NOT affect database
- Only `docker-compose down -v` or `docker volume rm` will delete data

**When to backup:**
- Before any major deployment
- Before running `docker-compose down -v`
- Daily via cron job (recommended)

```bash
# Quick backup before deployment
~/bidsquire/backup-database.sh
```

### Quick Reference Commands

| Task | Command |
|------|---------|
| Check status | `docker ps` |
| View logs | `docker logs ebay_project_frontend_1 --tail 100` |
| Restart frontend | `docker-compose restart frontend` |
| Rebuild frontend | `docker-compose build --no-cache frontend && docker-compose up -d frontend` |
| Full restart | `docker-compose down && docker-compose up -d` |
| Backup database | `~/bidsquire/backup-database.sh` |
| Check env vars | `docker exec ebay_project_frontend_1 printenv` |
| Connect to DB | `docker exec -it ebay_project_db_1 psql -U auctionuser -d auctionflow` |

### Troubleshooting Deployment Issues

**Issue: Old code still showing after deployment**
```bash
# Clear Docker build cache
docker builder prune -f
docker-compose build --no-cache frontend
```

**Issue: Container won't start**
```bash
# Check logs for errors
docker logs ebay_project_frontend_1 --tail 100

# Check if ports are in use
ss -tlnp | grep 3001
```

**Issue: "ContainerConfig" error with docker-compose**
```bash
# Stop and remove containers manually first
docker stop ebay_project_frontend_1 ebay_project_backend_1
docker rm ebay_project_frontend_1 ebay_project_backend_1
docker-compose up -d
```

**Issue: Environment variable not working**
```bash
# Verify it's in .env
cat ~/bidsquire/ebay_project/.env | grep VARIABLE_NAME

# Verify it's in docker-compose.yml (under frontend > environment)
cat ~/bidsquire/ebay_project/docker-compose.yml | grep VARIABLE_NAME

# Verify it's in the container
docker exec ebay_project_frontend_1 printenv | grep VARIABLE_NAME
```
