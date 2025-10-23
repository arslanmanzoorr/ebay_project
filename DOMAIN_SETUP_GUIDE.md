# 🌐 Bidsquire Domain Setup Guide

Complete guide for connecting your Bidsquire application to a custom domain.

---

## 📋 Prerequisites

- Domain name (e.g., `bidsquire.com` or `yourdomain.com`)
- Access to domain DNS settings
- Ubuntu server with public IP: `108.181.167.171`
- Bidsquire app running on port 3000
- Root or sudo access on server

---

## 🎯 Overview

We'll set up:
1. **Main domain:** `bidsquire.com` → Frontend
2. **API subdomain (optional):** `api.bidsquire.com` → Backend
3. **Admin subdomain (optional):** `admin.bidsquire.com` → Admin dashboard
4. **SSL Certificate:** Free Let's Encrypt HTTPS

---

## Step 1: DNS Configuration

### A. Login to Your Domain Registrar

(GoDaddy, Namecheap, Cloudflare, etc.)

### B. Add DNS Records

Add these DNS records:

| Type | Name | Value | TTL |
|------|------|-------|-----|
| A | @ | 108.181.167.171 | 3600 |
| A | www | 108.181.167.171 | 3600 |
| A | api | 108.181.167.171 | 3600 |
| A | admin | 108.181.167.171 | 3600 |

**What this does:**
- `bidsquire.com` → Points to your server
- `www.bidsquire.com` → Points to your server
- `api.bidsquire.com` → Points to your server
- `admin.bidsquire.com` → Points to your server

### C. Wait for DNS Propagation

DNS changes can take 5 minutes to 48 hours to propagate worldwide.

**Check DNS propagation:**
```bash
# From any computer
nslookup bidsquire.com
# Should return: 108.181.167.171

# Or use online tool
# https://www.whatsmydns.net/
```

---

## Step 2: Install Nginx on Ubuntu Server

```bash
# SSH into your server
ssh administrator@108.181.167.171

# Update system
sudo apt update

# Install Nginx
sudo apt install nginx -y

# Start and enable Nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# Check status
sudo systemctl status nginx

# Allow through firewall
sudo ufw allow 'Nginx Full'
sudo ufw allow 80
sudo ufw allow 443
```

---

## Step 3: Configure Nginx

### A. Create Nginx Configuration

```bash
# Create configuration file
sudo nano /etc/nginx/sites-available/bidsquire
```

### B. Add Configuration (Basic - HTTP only)

```nginx
# Basic HTTP configuration
server {
    listen 80;
    listen [::]:80;
    
    server_name bidsquire.com www.bidsquire.com;
    
    # Increase client body size for image uploads
    client_max_body_size 50M;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # Health check endpoint
    location /api/health {
        proxy_pass http://localhost:3000/api/health;
        access_log off;
    }
}

# Optional: API subdomain
server {
    listen 80;
    listen [::]:80;
    
    server_name api.bidsquire.com;
    
    location / {
        proxy_pass http://localhost:3000/api;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### C. Enable the Configuration

```bash
# Create symbolic link
sudo ln -s /etc/nginx/sites-available/bidsquire /etc/nginx/sites-enabled/

# Remove default configuration
sudo rm /etc/nginx/sites-enabled/default

# Test configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

---

## Step 4: Install SSL Certificate (HTTPS)

### A. Install Certbot

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y
```

### B. Obtain SSL Certificate

```bash
# Get certificate for all domains
sudo certbot --nginx -d bidsquire.com -d www.bidsquire.com -d api.bidsquire.com -d admin.bidsquire.com

# Follow prompts:
# - Enter email address
# - Agree to terms
# - Choose redirect (option 2 recommended)
```

### C. Auto-Renewal

Certbot automatically sets up renewal. Test it:

```bash
# Test renewal
sudo certbot renew --dry-run
```

---

## Step 5: Complete Nginx Configuration (with HTTPS)

After Certbot, your Nginx config will be updated automatically. Here's the complete version:

```bash
sudo nano /etc/nginx/sites-available/bidsquire
```

**Complete Configuration:**

```nginx
# Redirect HTTP to HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name bidsquire.com www.bidsquire.com;
    return 301 https://$server_name$request_uri;
}

# HTTPS - Main domain
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    
    server_name bidsquire.com www.bidsquire.com;
    
    # SSL Configuration (managed by Certbot)
    ssl_certificate /etc/letsencrypt/live/bidsquire.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/bidsquire.com/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    
    # Increase client body size for image uploads
    client_max_body_size 50M;
    
    # Logging
    access_log /var/log/nginx/bidsquire_access.log;
    error_log /var/log/nginx/bidsquire_error.log;
    
    # Frontend proxy
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # API endpoints
    location /api/ {
        proxy_pass http://localhost:3000/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Health check endpoint
    location /api/health {
        proxy_pass http://localhost:3000/api/health;
        access_log off;
    }
}

# API Subdomain (optional)
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    
    server_name api.bidsquire.com;
    
    ssl_certificate /etc/letsencrypt/live/bidsquire.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/bidsquire.com/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;
    
    location / {
        proxy_pass http://localhost:3000/api;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Admin Subdomain (optional)
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    
    server_name admin.bidsquire.com;
    
    ssl_certificate /etc/letsencrypt/live/bidsquire.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/bidsquire.com/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

**Apply Configuration:**

```bash
# Test configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

---

## Step 6: Update Application Configuration

### A. Update Environment Variables

```bash
cd ~/bidsquire/ebay_project/project

# Edit .env.local or create if doesn't exist
nano .env.local
```

Add/update:
```bash
NEXT_PUBLIC_API_URL=https://bidsquire.com
NEXT_PUBLIC_DOMAIN=bidsquire.com
NODE_ENV=production
```

### B. Update Next.js Configuration

```bash
nano next.config.js
```

Update domains for images:
```javascript
images: {
  domains: ['bidsquire.com', 'www.bidsquire.com', 'api.bidsquire.com', 'admin.bidsquire.com'],
  unoptimized: true,
  remotePatterns: [
    {
      protocol: 'https',
      hostname: '**',
    },
  ],
},
```

### C. Rebuild and Restart

```bash
# Rebuild with new configuration
cd ~/bidsquire/ebay_project/project
docker build -f Dockerfile.prod -t bidsquire-frontend:latest .

# Restart container
docker stop bidsquire-frontend
docker rm bidsquire-frontend
docker run -d --name bidsquire-frontend \
  -p 3000:3000 \
  -e DB_HOST=postgres \
  -e NEXT_PUBLIC_API_URL=https://bidsquire.com \
  --network ebay_project_default \
  bidsquire-frontend:latest
```

---

## Step 7: Verify Setup

### A. Test Domain

```bash
# Test HTTP (should redirect to HTTPS)
curl -I http://bidsquire.com

# Test HTTPS
curl -I https://bidsquire.com

# Test health endpoint
curl https://bidsquire.com/api/health
```

### B. Open in Browser

Visit:
- `https://bidsquire.com` - Main site
- `https://www.bidsquire.com` - WWW redirect
- `https://api.bidsquire.com` - API (if configured)
- `https://admin.bidsquire.com` - Admin (if configured)

---

## 🔧 Troubleshooting

### DNS not resolving?

```bash
# Check DNS
nslookup bidsquire.com

# If not working, wait 24 hours or clear DNS cache
```

### Nginx error?

```bash
# Check Nginx status
sudo systemctl status nginx

# View error logs
sudo tail -f /var/log/nginx/error.log

# Test configuration
sudo nginx -t
```

### SSL certificate issues?

```bash
# Check certificate
sudo certbot certificates

# Renew manually
sudo certbot renew

# View certbot logs
sudo tail -f /var/log/letsencrypt/letsencrypt.log
```

### 502 Bad Gateway?

```bash
# Check if frontend is running
docker ps | grep bidsquire

# Check frontend logs
docker logs bidsquire-frontend

# Restart frontend
docker restart bidsquire-frontend
```

### Can't access from domain but localhost works?

```bash
# Check firewall
sudo ufw status

# Allow ports
sudo ufw allow 80
sudo ufw allow 443

# Check Nginx is listening
sudo netstat -tlnp | grep nginx
```

---

## 📊 Quick Setup Script

Save this as `setup-domain.sh`:

```bash
#!/bin/bash
# Domain Setup Script

DOMAIN="bidsquire.com"
EMAIL="your-email@example.com"

echo "Setting up domain: $DOMAIN"

# Install Nginx
sudo apt update
sudo apt install nginx certbot python3-certbot-nginx -y

# Create Nginx config
sudo cat > /etc/nginx/sites-available/bidsquire << 'EOF'
server {
    listen 80;
    server_name bidsquire.com www.bidsquire.com;
    
    client_max_body_size 50M;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

# Enable site
sudo ln -s /etc/nginx/sites-available/bidsquire /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx

# Get SSL certificate
sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN --email $EMAIL --agree-tos --non-interactive --redirect

echo "Domain setup complete!"
echo "Visit: https://$DOMAIN"
```

**Run it:**
```bash
chmod +x setup-domain.sh
sudo ./setup-domain.sh
```

---

## ✅ Final Checklist

After setup:

- [ ] DNS records point to 108.181.167.171
- [ ] Nginx installed and running
- [ ] Domain resolves: `nslookup bidsquire.com`
- [ ] HTTP redirects to HTTPS
- [ ] SSL certificate valid (green padlock)
- [ ] Frontend accessible via domain
- [ ] API endpoints working
- [ ] Health check responds: `curl https://bidsquire.com/api/health`
- [ ] Can login to admin dashboard
- [ ] Images load correctly
- [ ] No mixed content warnings

---

## 🔄 Maintenance

### Renew SSL Certificate

Automatic renewal is set up, but to manually renew:

```bash
sudo certbot renew
sudo systemctl reload nginx
```

### Update Domain Configuration

```bash
sudo nano /etc/nginx/sites-available/bidsquire
sudo nginx -t
sudo systemctl reload nginx
```

### View Logs

```bash
# Nginx access logs
sudo tail -f /var/log/nginx/bidsquire_access.log

# Nginx error logs
sudo tail -f /var/log/nginx/bidsquire_error.log

# Frontend logs
docker logs -f bidsquire-frontend
```

---

## 🌐 Multiple Domains

To add more domains (e.g., `bidsquire.net`):

```bash
# Add DNS records for new domain
# Then update Nginx:
sudo nano /etc/nginx/sites-available/bidsquire

# Add to server_name:
server_name bidsquire.com www.bidsquire.com bidsquire.net www.bidsquire.net;

# Get SSL for new domain:
sudo certbot --nginx -d bidsquire.net -d www.bidsquire.net

# Reload:
sudo systemctl reload nginx
```

---

**Domain setup complete!** Your Bidsquire app should now be accessible at your custom domain with HTTPS! 🎉

