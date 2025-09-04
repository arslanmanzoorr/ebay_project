# 🚀 Bidsquire Auction Platform - Complete Deployment Guide

A comprehensive guide to deploy your auction management platform with PostgreSQL, Next.js, and Docker.

## 📋 Prerequisites

- **Docker Desktop** installed and running
- **Git** for code management
- **Windows 10/11** or **macOS/Linux**
- **8GB RAM** minimum (16GB recommended)

## 🏗️ Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   Database      │
│   (Next.js)     │◄──►│   (Django)      │◄──►│   (PostgreSQL)  │
│   Port: 3000    │    │   Port: 8000    │    │   Port: 5432    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │   Nginx         │
                    │   (Reverse      │
                    │   Proxy)        │
                    │   Port: 80      │
                    └─────────────────┘
```

## ⚡ Quick Start (5 Minutes)

### 1. Clone and Setup
```bash
git clone <your-repo-url>
cd ebay_project
```

### 2. Generate Secrets
```bash
# Generate Django secret key
python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"

# Copy the output - you'll need it!
```

### 3. Configure Environment
```bash
# Copy the production template
cp env.production.template .env.production

# Edit the file with your values
notepad .env.production  # Windows
# or
nano .env.production     # Linux/Mac
```

**Required Environment Variables:**
```bash
# Database Configuration
POSTGRES_DB=auctionflow
POSTGRES_USER=auctionuser
POSTGRES_PASSWORD=your_secure_password_here
POSTGRES_HOST=postgres
POSTGRES_PORT=5432

# Admin User (Auto-created)
ADMIN_NAME=Your Company Admin
ADMIN_EMAIL=admin@yourcompany.com
ADMIN_PASSWORD=YourSecurePassword123!

# Security
SECRET_KEY=your_generated_secret_key_here
ALLOWED_HOSTS=localhost,yourdomain.com

# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

### 4. Deploy Everything
```bash
# Windows
.\deploy-prod.ps1

# Linux/Mac
./deploy-prod.sh
```

### 5. Access Your Application
- **Frontend**: http://localhost:3000
- **Admin Panel**: http://localhost:3000/admin
- **API Health**: http://localhost:3000/api/health

**Default Admin Login:**
- Email: `admin@yourcompany.com` (or what you set)
- Password: `YourSecurePassword123!` (or what you set)

## 🔧 Detailed Configuration

### Environment Variables Explained

| Variable | Description | Example |
|----------|-------------|---------|
| `POSTGRES_DB` | Database name | `auctionflow` |
| `POSTGRES_USER` | Database username | `auctionuser` |
| `POSTGRES_PASSWORD` | Database password | `MySecurePass123!` |
| `ADMIN_EMAIL` | Admin login email | `admin@mycompany.com` |
| `ADMIN_PASSWORD` | Admin login password | `AdminPass123!` |
| `SECRET_KEY` | Django secret key | `kqzx^w%61wi6du#c%f*!#k!i&!j$3_29pyq1!js_#5bh%bzmij` |

### Database Schema

The application automatically creates these tables:
- `users` - User accounts and authentication
- `auction_items` - Auction item management
- `webhook_data` - External webhook integration
- `user_sessions` - Session management

## 🐳 Docker Services

### Service Overview
```yaml
services:
  postgres:     # PostgreSQL database
  redis:        # Caching and sessions
  backend:      # Django API server
  frontend:     # Next.js application
  nginx:        # Reverse proxy and SSL
```

### Container Management
```bash
# Start all services
docker-compose -f docker-compose.prod.yml up -d

# Stop all services
docker-compose -f docker-compose.prod.yml down

# View running containers
docker-compose -f docker-compose.prod.yml ps

# View logs
docker-compose -f docker-compose.prod.yml logs -f

# Restart a specific service
docker-compose -f docker-compose.prod.yml restart frontend
```

## 👥 User Management

### User Roles
- **Admin**: Full system access, user management
- **Researcher**: Item research and estimation
- **Researcher2**: Final review and validation
- **Photographer**: Image upload and management

### Creating Users
1. Login to admin panel: http://localhost:3000/admin
2. Navigate to "Manage Users"
3. Click "Add New User"
4. Fill in user details and select role
5. Save - user is immediately available

### Admin User Creation
The admin user is created automatically on first startup using environment variables. You can also create it manually:

```bash
cd project
node scripts/init-admin.js
```

## 🔒 Security Features

### Authentication
- JWT-based authentication
- Role-based access control
- Session management with Redis
- Password hashing with bcrypt

### Database Security
- Encrypted connections (SSL in production)
- Parameterized queries (SQL injection prevention)
- Connection pooling for performance

### API Security
- CORS configuration
- Rate limiting
- Input validation
- Error handling without data exposure

## 🚨 Troubleshooting

### Common Issues

#### "Port already in use"
```bash
# Check what's using the port
netstat -ano | findstr :3000  # Windows
lsof -i :3000                 # Linux/Mac

# Kill the process
taskkill /PID <process_id> /F  # Windows
kill -9 <process_id>          # Linux/Mac
```

#### "Database connection failed"
```bash
# Check database container
docker-compose logs postgres

# Restart database
docker-compose restart postgres

# Check database status
docker-compose exec postgres psql -U auctionuser -d auctionflow -c "SELECT 1;"
```

#### "Can't add users from frontend"
```bash
# Check frontend logs
docker-compose logs frontend

# Verify database connection
docker-compose exec frontend npm run db:test

# Restart frontend
docker-compose restart frontend
```

#### "Admin user not created"
```bash
# Check if admin exists
docker-compose exec postgres psql -U auctionuser -d auctionflow -c "SELECT * FROM users WHERE role='admin';"

# Create admin manually
cd project && node scripts/init-admin.js
```

### Log Analysis
```bash
# View all logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f frontend
docker-compose logs -f backend
docker-compose logs -f postgres

# View last 100 lines
docker-compose logs --tail=100 frontend
```

## 📊 Monitoring & Maintenance

### Health Checks
```bash
# Check API health
curl http://localhost:3000/api/health

# Check database connectivity
docker-compose exec postgres pg_isready -U auctionuser

# Check all services
docker-compose ps
```

### Backup Database
```bash
# Create backup
docker-compose exec postgres pg_dump -U auctionuser auctionflow > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore backup
docker-compose exec -T postgres psql -U auctionuser auctionflow < backup_file.sql
```

### Update Application
```bash
# Pull latest changes
git pull origin main

# Rebuild and restart
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml build --no-cache
docker-compose -f docker-compose.prod.yml up -d
```

## 🌐 Production Deployment

### Domain Configuration
1. Update `ALLOWED_HOSTS` in `.env.production`
2. Configure DNS to point to your server
3. Update `NEXT_PUBLIC_API_URL` with your domain
4. Set up SSL certificates (Let's Encrypt recommended)

### SSL Setup
```bash
# Generate SSL certificates
cd nginx
./generate-ssl.sh yourdomain.com

# Update nginx configuration
# Edit nginx/conf.d/production.conf
```

### Performance Optimization
- Enable Redis caching
- Configure Nginx compression
- Set up CDN for static assets
- Monitor resource usage

## 📈 Scaling

### Horizontal Scaling
- Use Docker Swarm or Kubernetes
- Load balance with multiple frontend instances
- Separate database to dedicated server
- Use managed PostgreSQL service

### Vertical Scaling
- Increase container memory limits
- Optimize database queries
- Enable connection pooling
- Use SSD storage for database

## 🆘 Support

### Getting Help
1. Check the logs first: `docker-compose logs -f`
2. Verify all containers are running: `docker-compose ps`
3. Test database connection: `docker-compose exec postgres psql -U auctionuser -d auctionflow`
4. Check environment variables: `docker-compose config`

### Useful Commands
```bash
# Complete reset (WARNING: Deletes all data)
docker-compose down -v
docker system prune -a
docker-compose -f docker-compose.prod.yml up -d

# View container resource usage
docker stats

# Access container shell
docker-compose exec frontend sh
docker-compose exec postgres psql -U auctionuser -d auctionflow
```

---

## 🎉 Success!

Your Bidsquire Auction Platform is now running with:
- ✅ **PostgreSQL Database** with working connections
- ✅ **User Management** with role-based access
- ✅ **Admin Panel** for system management
- ✅ **API Endpoints** for all operations
- ✅ **Docker Containerization** for easy deployment
- ✅ **Nginx Reverse Proxy** for production readiness

**Happy Bidding!** 🚀
