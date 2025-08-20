# Ubuntu Production Deployment Guide

This guide will help you deploy the Auction Workflow application to production on Ubuntu.

## 🚀 Prerequisites

### System Requirements
- Ubuntu 20.04 LTS or later
- Minimum 2GB RAM
- Minimum 20GB disk space
- Docker and Docker Compose installed

### Install Docker on Ubuntu
```bash
# Update package index
sudo apt update

# Install prerequisites
sudo apt install -y apt-transport-https ca-certificates curl software-properties-common

# Add Docker's official GPG key
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

# Add Docker repository
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io

# Add user to docker group
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Logout and login again for group changes to take effect
```

## 📁 Project Setup

### 1. Clone the Repository
```bash
git clone <your-repository-url>
cd auction-workflow
```

### 2. Create Production Environment File
```bash
cp env.prod.template .env.prod
```

### 3. Update Environment Variables
Edit `.env.prod` file with your production values:
```bash
nano .env.prod
```

**Important variables to update:**
- `POSTGRES_PASSWORD`: Strong database password
- `REDIS_PASSWORD`: Strong Redis password
- `JWT_SECRET`: Generate with `openssl rand -base64 32`
- `DOMAIN`: Your domain name
- `SSL_EMAIL`: Your email for SSL certificates

## 🐳 Docker Configuration

### 1. Production Docker Compose
The application uses `docker-compose.prod.yml` which includes:
- **Frontend**: Next.js application
- **Database**: PostgreSQL 15
- **Cache**: Redis 7
- **Proxy**: Nginx with security headers

### 2. Build and Deploy
```bash
# Make deployment script executable
chmod +x deploy-prod.sh

# Run production deployment
./deploy-prod.sh
```

## 🔒 Security Configuration

### 1. Firewall Setup
```bash
# Allow SSH (if not already allowed)
sudo ufw allow ssh

# Allow HTTP and HTTPS
sudo ufw allow 80
sudo ufw allow 443

# Enable firewall
sudo ufw enable
```

### 2. SSL Certificate (Let's Encrypt)
```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

### 3. Update Nginx SSL Configuration
After getting SSL certificate, update `nginx/conf.d/default.conf`:
```nginx
server {
    listen 443 ssl http2;
    server_name your-domain.com;
    
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    
    # ... rest of configuration
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}
```

## 📊 Monitoring and Maintenance

### 1. View Logs
```bash
# All services
docker-compose -f docker-compose.prod.yml logs -f

# Specific service
docker-compose -f docker-compose.prod.yml logs -f frontend
docker-compose -f docker-compose.prod.yml logs -f nginx
```

### 2. Service Management
```bash
# Stop services
docker-compose -f docker-compose.prod.yml down

# Restart services
docker-compose -f docker-compose.prod.yml restart

# Update and rebuild
docker-compose -f docker-compose.prod.yml up -d --build
```

### 3. Database Backup
```bash
# Create backup
docker-compose -f docker-compose.prod.yml exec db pg_dump -U auctionuser auctionflow > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore backup
docker-compose -f docker-compose.prod.yml exec -T db psql -U auctionuser auctionflow < backup_file.sql
```

## 🚨 Troubleshooting

### Common Issues

#### 1. Port Already in Use
```bash
# Check what's using the port
sudo netstat -tulpn | grep :80

# Kill process if needed
sudo kill -9 <PID>
```

#### 2. Permission Issues
```bash
# Fix Docker permissions
sudo chown -R $USER:$USER ~/.docker
sudo chmod -R 755 ~/.docker
```

#### 3. Database Connection Issues
```bash
# Check database status
docker-compose -f docker-compose.prod.yml exec db pg_isready -U auctionuser

# Check logs
docker-compose -f docker-compose.prod.yml logs db
```

#### 4. Frontend Build Issues
```bash
# Clear Docker cache
docker system prune -af

# Rebuild without cache
docker-compose -f docker-compose.prod.yml build --no-cache frontend
```

## 📈 Performance Optimization

### 1. Nginx Optimization
- Gzip compression enabled
- Static file caching
- Rate limiting configured

### 2. Database Optimization
- Connection pooling
- Health checks enabled
- Proper indexing

### 3. Redis Optimization
- Persistence enabled
- Password protection
- Health checks configured

## 🔄 Updates and Maintenance

### 1. Application Updates
```bash
# Pull latest code
git pull origin main

# Rebuild and restart
docker-compose -f docker-compose.prod.yml up -d --build
```

### 2. System Updates
```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Restart Docker
sudo systemctl restart docker
```

### 3. Security Updates
```bash
# Check for security updates
sudo apt list --upgradable

# Install security updates
sudo apt upgrade -y
```

## 📞 Support

### Health Check Endpoints
- **Frontend**: `http://your-domain.com/api/health`
- **Nginx**: `http://your-domain.com/health`

### Log Locations
- **Application**: `docker-compose -f docker-compose.prod.yml logs`
- **Nginx**: `./nginx/logs/`
- **System**: `/var/log/syslog`

### Emergency Commands
```bash
# Stop all services
docker-compose -f docker-compose.prod.yml down

# Remove all data (WARNING: Destructive)
docker-compose -f docker-compose.prod.yml down -v
docker volume prune -f
```

## ✅ Production Checklist

- [ ] Docker and Docker Compose installed
- [ ] Environment variables configured
- [ ] Firewall configured
- [ ] SSL certificate obtained
- [ ] Services running and healthy
- [ ] Database backed up
- [ ] Monitoring configured
- [ ] Admin password changed
- [ ] Security headers enabled
- [ ] Rate limiting configured

---

**Your application is now production-ready! 🎉**

For additional support, check the logs and ensure all services are healthy before going live.
