# 🚀 Ubuntu Deployment Guide - Database in Docker + Frontend Native

This guide will help you deploy the eBay Auction Platform on Ubuntu with PostgreSQL in Docker and the frontend running natively.

## 📋 Prerequisites

- Ubuntu server with Docker installed
- Git access to the repository
- Basic knowledge of Linux commands

## 🔧 Step-by-Step Deployment

### 1. Pull the Latest Code
```bash
# Navigate to your project directory
cd /path/to/your/ebay_project

# Pull the latest changes
git pull origin main
```

### 2. Install Node.js (if not already installed)
```bash
# Update package index
sudo apt update

# Install Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version
npm --version
```

### 3. Start PostgreSQL Database in Docker
```bash
# Start the database container
docker-compose up -d db

# Verify it's running
docker ps
```

### 4. Add Missing Database Columns
```bash
# Add all required columns to the database
docker exec -it ebay_project-db-1 psql -U auctionuser -d auctionflow -c "
ALTER TABLE auction_items ADD COLUMN IF NOT EXISTS url_main TEXT;
ALTER TABLE auction_items ADD COLUMN IF NOT EXISTS parent_item_id TEXT;
ALTER TABLE auction_items ADD COLUMN IF NOT EXISTS sub_item_number INTEGER;
ALTER TABLE auction_items ADD COLUMN IF NOT EXISTS priority VARCHAR(20) DEFAULT 'medium';
ALTER TABLE auction_items ADD COLUMN IF NOT EXISTS photographer_notes TEXT;
"

# Verify columns were added
docker exec -it ebay_project-db-1 psql -U auctionuser -d auctionflow -c "\d auction_items"
```

### 5. Install Frontend Dependencies
```bash
# Navigate to project directory
cd project

# Install dependencies
npm install
```

### 6. Set up Environment Variables
```bash
# Create production environment file
cat > .env.local << EOF
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=auctionflow
POSTGRES_USER=auctionuser
POSTGRES_PASSWORD=auctionpass123
NODE_ENV=production
EOF
```

### 7. Install PM2 for Process Management
```bash
# Install PM2 globally
sudo npm install -g pm2

# Create PM2 ecosystem file
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'ebay-auction-frontend',
    script: 'npm',
    args: 'run dev',
    cwd: '$(pwd)',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
};
EOF
```

### 8. Start the Application
```bash
# Start with PM2
pm2 start ecosystem.config.js

# Check PM2 status
pm2 status

# View logs
pm2 logs ebay-auction-frontend
```

### 9. Set up PM2 to Start on Boot
```bash
# Save PM2 configuration
pm2 save

# Generate startup script
pm2 startup

# Follow the instructions provided (usually run a sudo command)
# Example: sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u ubuntu --hp /home/ubuntu
```

## 🧪 Testing the Deployment

### Test Database Connection
```bash
# Test database connectivity
docker exec -it ebay_project-db-1 psql -U auctionuser -d auctionflow -c "SELECT COUNT(*) FROM auction_items;"
```

### Test Frontend API
```bash
# Test health endpoint
curl http://localhost:3000/api/health

# Test if frontend is accessible
curl http://localhost:3000
```

### Test Webhook Endpoint
```bash
# Test webhook endpoint
curl -X POST http://localhost:3000/api/webhook/receive \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}'
```

## 🔍 Monitoring and Maintenance

### Check Application Status
```bash
# Check PM2 processes
pm2 status

# View real-time logs
pm2 logs ebay-auction-frontend --lines 50

# Restart application
pm2 restart ebay-auction-frontend

# Stop application
pm2 stop ebay-auction-frontend
```

### Check Database Status
```bash
# Check Docker containers
docker ps

# Check database logs
docker logs ebay_project-db-1

# Restart database if needed
docker-compose restart db
```

### Update Application
```bash
# Pull latest changes
git pull origin main

# Install new dependencies (if any)
cd project && npm install

# Restart application
pm2 restart ebay-auction-frontend
```

## 🚨 Troubleshooting

### Common Issues

1. **Database Connection Failed**
   ```bash
   # Check if database is running
   docker ps | grep postgres
   
   # Check database logs
   docker logs ebay_project-db-1
   ```

2. **Frontend Not Starting**
   ```bash
   # Check PM2 logs
   pm2 logs ebay-auction-frontend
   
   # Check if port 3000 is available
   netstat -tlnp | grep :3000
   ```

3. **Missing Dependencies**
   ```bash
   # Reinstall dependencies
   cd project
   rm -rf node_modules package-lock.json
   npm install
   ```

4. **Permission Issues**
   ```bash
   # Fix PM2 permissions
   sudo chown -R ubuntu:ubuntu ~/.pm2
   ```

## 📊 Performance Monitoring

### Monitor Resource Usage
```bash
# Check PM2 monitoring
pm2 monit

# Check system resources
htop

# Check disk usage
df -h
```

### Database Performance
```bash
# Check database size
docker exec -it ebay_project-db-1 psql -U auctionuser -d auctionflow -c "SELECT pg_size_pretty(pg_database_size('auctionflow'));"

# Check table sizes
docker exec -it ebay_project-db-1 psql -U auctionuser -d auctionflow -c "SELECT schemaname,tablename,pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size FROM pg_tables WHERE schemaname='public' ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;"
```

## 🔒 Security Considerations

### Firewall Setup
```bash
# Allow only necessary ports
sudo ufw allow 22    # SSH
sudo ufw allow 3000  # Frontend
sudo ufw enable
```

### Database Security
```bash
# Change default passwords
docker exec -it ebay_project-db-1 psql -U auctionuser -d auctionflow -c "ALTER USER auctionuser PASSWORD 'your_secure_password';"
```

## 📝 Quick Commands Reference

```bash
# Start everything
docker-compose up -d db && pm2 start ecosystem.config.js

# Stop everything
pm2 stop ebay-auction-frontend && docker-compose down

# Restart everything
pm2 restart ebay-auction-frontend

# View logs
pm2 logs ebay-auction-frontend

# Check status
pm2 status && docker ps
```

## 🎯 Success Indicators

Your deployment is successful when:
- ✅ Database container is running (`docker ps` shows postgres container)
- ✅ Frontend is running (`pm2 status` shows running process)
- ✅ Health endpoint responds (`curl http://localhost:3000/api/health`)
- ✅ Web interface is accessible (`curl http://localhost:3000`)
- ✅ All database columns are present (no INSERT errors in logs)

---

**Note**: Replace `auctionpass123` with your actual database password and update the file paths as needed for your specific setup.
