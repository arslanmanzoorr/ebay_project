# 🚀 Bidsquire Complete Deployment Guide

Everything you need to deploy Bidsquire to your Ubuntu server with a custom domain.

---

## 📚 Available Guides

| Document | Purpose |
|----------|---------|
| **DEPLOYMENT_SUMMARY.md** | Quick overview of all changes and deployment status |
| **QUICK_DEPLOYMENT_GUIDE.md** | Fast reference for deploying changes |
| **UBUNTU_DEPLOY_COMMANDS.txt** | Copy-paste commands for Ubuntu |
| **DOMAIN_SETUP_GUIDE.md** | Complete domain and SSL setup |
| **API_DOCUMENTATION.md** | Full API reference |
| **DEPLOYMENT_GUIDE.md** | Detailed Docker deployment |

---

## 🎯 Quick Start - Ubuntu Server

### 1. Deploy Frontend with New Changes

```bash
# SSH into server
ssh administrator@108.181.167.171

# Navigate to project
cd ~/bidsquire/ebay_project

# Pull latest code
git pull origin main

# Stop old services
pm2 stop ebay-frontend 2>/dev/null || true
pm2 delete ebay-frontend 2>/dev/null || true
docker stop bidsquire-frontend 2>/dev/null || true
docker rm bidsquire-frontend 2>/dev/null || true

# Build and start new container
cd project
docker build -f Dockerfile.prod -t bidsquire-frontend:latest .
cd ..

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

# Verify
docker logs -f bidsquire-frontend
```

### 2. Setup Domain (Optional)

```bash
# Download setup script
cd ~/bidsquire/ebay_project

# Edit domain configuration
nano setup-domain.sh
# Change: DOMAIN="your-domain.com"
# Change: EMAIL="your-email@example.com"

# Run setup
chmod +x setup-domain.sh
sudo ./setup-domain.sh
```

---

## 🌐 Domain Setup Summary

### DNS Configuration

Add these records at your domain registrar:

| Type | Name | Value | TTL |
|------|------|-------|-----|
| A | @ | 108.181.167.171 | 3600 |
| A | www | 108.181.167.171 | 3600 |

### Quick Domain Setup

```bash
# 1. Install Nginx and Certbot
sudo apt update
sudo apt install nginx certbot python3-certbot-nginx -y

# 2. Run setup script
sudo ./setup-domain.sh

# 3. Done! Visit https://your-domain.com
```

---

## ✅ What's Included in This Deployment

### Frontend Changes
- ✅ Bidsquire logo on navbar, login, and main page
- ✅ Fixed duplicate "Create eBay Draft" buttons
- ✅ Verified "View Original Listing" button
- ✅ Updated branding from AuctionFlow to Bidsquire
- ✅ Database configuration with environment variables

### Infrastructure
- ✅ Production-ready Docker container
- ✅ Health check endpoints
- ✅ Automatic restarts
- ✅ SSL/HTTPS support via Nginx
- ✅ Environment variable configuration

---

## 📁 Project Structure

```
ebay_project/
├── project/                          # Next.js Frontend
│   ├── app/                         # Pages and routes
│   ├── components/                  # React components
│   ├── services/                    # Database and API services
│   ├── Dockerfile.prod              # Production Docker config
│   └── next.config.js               # Next.js configuration
│
├── postgres-init/                    # Database initialization
│   └── init-database.sql            # DB schema and default data
│
├── docker-compose.yml                # Docker orchestration
│
├── Deployment Scripts (Ubuntu)
│   ├── build-frontend-image.sh      # Build Docker image
│   ├── deploy-frontend-complete.sh  # Full deployment
│   ├── restart-frontend.sh          # Quick restart
│   └── setup-domain.sh              # Domain/SSL setup
│
├── Documentation
│   ├── DEPLOYMENT_SUMMARY.md        # This overview
│   ├── DOMAIN_SETUP_GUIDE.md        # Domain configuration
│   ├── API_DOCUMENTATION.md         # API reference
│   └── UBUNTU_DEPLOY_COMMANDS.txt   # Quick commands
│
└── README_DEPLOYMENT.md              # You are here!
```

---

## 🔧 Common Tasks

### Restart Frontend
```bash
docker restart bidsquire-frontend
```

### View Logs
```bash
docker logs -f bidsquire-frontend
```

### Check Status
```bash
docker ps | grep bidsquire
curl http://localhost:3000/api/health
```

### Rebuild with New Changes
```bash
cd ~/bidsquire/ebay_project
git pull
cd project
docker build -f Dockerfile.prod -t bidsquire-frontend:latest .
docker stop bidsquire-frontend && docker rm bidsquire-frontend
docker run -d --name bidsquire-frontend -p 3000:3000 -e DB_HOST=postgres --network ebay_project_default bidsquire-frontend:latest
```

### Update Domain Configuration
```bash
sudo nano /etc/nginx/sites-available/bidsquire
sudo nginx -t
sudo systemctl reload nginx
```

---

## 🆘 Troubleshooting

### Frontend won't start
```bash
# Check logs
docker logs bidsquire-frontend

# Check if port is in use
sudo lsof -i :3000

# Restart
docker restart bidsquire-frontend
```

### Database connection failed
```bash
# Check database is running
docker ps | grep postgres

# Restart database
docker restart ebay_project_postgres_1

# Test connection
docker exec bidsquire-frontend ping postgres
```

### Domain not accessible
```bash
# Check DNS
nslookup your-domain.com

# Check Nginx
sudo systemctl status nginx
sudo nginx -t

# View logs
sudo tail -f /var/log/nginx/error.log
```

### SSL certificate issues
```bash
# Check certificate
sudo certbot certificates

# Renew
sudo certbot renew

# Test renewal
sudo certbot renew --dry-run
```

---

## 📞 Access Points

### Development
- **Local:** http://localhost:3000
- **Server IP:** http://108.181.167.171:3000

### Production (After Domain Setup)
- **Main:** https://your-domain.com
- **WWW:** https://www.your-domain.com
- **API:** https://your-domain.com/api
- **Health:** https://your-domain.com/api/health

---

## 👤 Admin Credentials

### Super Admin
- **Email:** superadmin@auctionflow.com
- **Password:** SuperAdmin@2024!

### Admin
- **Email:** admin@auctionflow.com
- **Password:** Admin@bids25

---

## 📊 System Status Commands

```bash
# Check all services
docker ps

# Check Nginx
sudo systemctl status nginx

# Check disk space
df -h
docker system df

# Check memory
free -h

# Check CPU
top

# Check logs
docker logs bidsquire-frontend
sudo tail -f /var/log/nginx/bidsquire_access.log
```

---

## 🔄 Update Workflow

1. **Make changes on Windows PC**
2. **Commit and push to git**
   ```powershell
   git add .
   git commit -m "Your changes"
   git push origin main
   ```

3. **Deploy on server**
   ```bash
   ssh administrator@108.181.167.171
   cd ~/bidsquire/ebay_project
   git pull
   # Then rebuild as shown above
   ```

---

## 🎓 Learning Resources

- **Next.js Docs:** https://nextjs.org/docs
- **Docker Docs:** https://docs.docker.com
- **Nginx Docs:** https://nginx.org/en/docs/
- **Certbot Docs:** https://certbot.eff.org/docs/

---

## 📝 Notes

- All scripts are tested on Ubuntu 20.04/22.04
- Docker must be installed on the server
- Ports 3000, 80, and 443 must be open
- DNS changes can take up to 48 hours to propagate
- SSL certificates auto-renew every 90 days

---

## ✅ Deployment Checklist

Before deploying:
- [ ] Code changes committed and pushed
- [ ] Database is running on server
- [ ] Ports 3000, 80, 443 are open
- [ ] Domain DNS records configured (if using domain)

After deploying:
- [ ] Container is running: `docker ps`
- [ ] Health check passes: `curl http://localhost:3000/api/health`
- [ ] Frontend accessible via IP or domain
- [ ] Can login with admin credentials
- [ ] Bidsquire logo visible
- [ ] No duplicate buttons
- [ ] SSL certificate valid (if using domain)

---

## 🚀 Ready to Deploy!

Choose your deployment method:

1. **Quick Deploy (IP only):** Use `UBUNTU_DEPLOY_COMMANDS.txt`
2. **Full Deploy with Domain:** Follow `DOMAIN_SETUP_GUIDE.md`
3. **Automated Setup:** Run `setup-domain.sh`

---

**Need Help?**
- Check `DEPLOYMENT_SUMMARY.md` for overview
- See `QUICK_DEPLOYMENT_GUIDE.md` for fast reference
- Read `API_DOCUMENTATION.md` for API details

**Last Updated:** October 23, 2025  
**Version:** 2.0  
**Status:** Production Ready ✅

