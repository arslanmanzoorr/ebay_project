#!/bin/bash
# Bidsquire Domain Setup Script
# Run this on your Ubuntu server to set up Nginx and SSL

echo "========================================"
echo "  Bidsquire Domain Setup"
echo "========================================"
echo ""

# Configuration - CHANGE THESE!
DOMAIN="bidsquire.com"
EMAIL="your-email@example.com"
FRONTEND_PORT="3000"

echo "Domain: $DOMAIN"
echo "Email: $EMAIL"
echo "Frontend Port: $FRONTEND_PORT"
echo ""

# Confirm
read -p "Is this correct? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Please edit the script and update the configuration"
    exit 1
fi

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo "Please run with sudo: sudo ./setup-domain.sh"
    exit 1
fi

# Step 1: Update system
echo ""
echo "Step 1: Updating system..."
apt update

# Step 2: Install Nginx
echo ""
echo "Step 2: Installing Nginx..."
apt install nginx -y

# Start and enable Nginx
systemctl start nginx
systemctl enable nginx

echo "✓ Nginx installed"

# Step 3: Install Certbot
echo ""
echo "Step 3: Installing Certbot..."
apt install certbot python3-certbot-nginx -y

echo "✓ Certbot installed"

# Step 4: Configure firewall
echo ""
echo "Step 4: Configuring firewall..."
ufw allow 'Nginx Full'
ufw allow 80
ufw allow 443

echo "✓ Firewall configured"

# Step 5: Create Nginx configuration
echo ""
echo "Step 5: Creating Nginx configuration..."

cat > /etc/nginx/sites-available/bidsquire << EOF
# Bidsquire Nginx Configuration

server {
    listen 80;
    listen [::]:80;
    
    server_name $DOMAIN www.$DOMAIN;
    
    # Increase client body size for image uploads
    client_max_body_size 50M;
    
    # Logging
    access_log /var/log/nginx/bidsquire_access.log;
    error_log /var/log/nginx/bidsquire_error.log;
    
    location / {
        proxy_pass http://localhost:$FRONTEND_PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # Health check endpoint
    location /api/health {
        proxy_pass http://localhost:$FRONTEND_PORT/api/health;
        access_log off;
    }
}
EOF

# Enable site
ln -sf /etc/nginx/sites-available/bidsquire /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test configuration
nginx -t

if [ $? -ne 0 ]; then
    echo "✗ Nginx configuration error"
    exit 1
fi

# Reload Nginx
systemctl reload nginx

echo "✓ Nginx configured"

# Step 6: Get SSL certificate
echo ""
echo "Step 6: Getting SSL certificate..."
echo "This will take a moment..."

certbot --nginx \
    -d $DOMAIN \
    -d www.$DOMAIN \
    --email $EMAIL \
    --agree-tos \
    --non-interactive \
    --redirect

if [ $? -eq 0 ]; then
    echo "✓ SSL certificate obtained"
else
    echo "⚠ SSL certificate failed, but site is accessible via HTTP"
    echo "You can retry: sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN"
fi

# Step 7: Test auto-renewal
echo ""
echo "Step 7: Testing SSL auto-renewal..."
certbot renew --dry-run

# Final status
echo ""
echo "========================================"
echo "  Setup Complete!"
echo "========================================"
echo ""
echo "Your site is now accessible at:"
echo "  - http://$DOMAIN (redirects to HTTPS)"
echo "  - https://$DOMAIN ✓"
echo "  - https://www.$DOMAIN ✓"
echo ""
echo "SSL Certificate:"
if [ $? -eq 0 ]; then
    echo "  ✓ Valid and auto-renewing"
else
    echo "  ⚠ Check manually with: sudo certbot certificates"
fi
echo ""
echo "Next Steps:"
echo "  1. Test in browser: https://$DOMAIN"
echo "  2. View logs: sudo tail -f /var/log/nginx/bidsquire_access.log"
echo "  3. Restart Nginx: sudo systemctl restart nginx"
echo ""
echo "Useful Commands:"
echo "  - Check Nginx: sudo systemctl status nginx"
echo "  - Check SSL: sudo certbot certificates"
echo "  - Renew SSL: sudo certbot renew"
echo "  - View logs: sudo tail -f /var/log/nginx/bidsquire_error.log"
echo ""
echo "========================================"

