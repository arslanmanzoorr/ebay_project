# 🚀 Production Deployment Guide for AuctionFlow

This guide will help you deploy your AuctionFlow application to production using Docker.

## 📋 Prerequisites

- Docker and Docker Compose installed
- A domain name (optional, but recommended for production)
- SSL certificate (optional, but recommended for production)

## 🔧 Configuration

### 1. Environment Setup

Copy the production environment template and update the values:

```bash
cp env.prod.template .env.prod
```

Edit `.env.prod` and update these critical values:

```bash
# Change these values for production
SECRET_KEY=your-super-secret-key-here
POSTGRES_PASSWORD=your-secure-database-password
ALLOWED_HOSTS=your-domain.com,www.your-domain.com
CORS_ALLOWED_ORIGINS=https://your-domain.com
NEXT_PUBLIC_API_URL=https://your-domain.com/api
```

### 2. Generate Secure Secret Key

Generate a secure Django secret key:

```bash
python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
```

## 🐳 Deployment

### Option 1: Using PowerShell (Windows)

```powershell
.\deploy-prod.ps1
```

### Option 2: Using Bash (Linux/Mac)

```bash
chmod +x deploy-prod.sh
./deploy-prod.sh
```

### Option 3: Manual Deployment

```bash
# Build and start services
docker-compose -f docker-compose.prod.yml up --build -d

# Wait for services to be ready
sleep 30

# Run migrations
docker-compose -f docker-compose.prod.yml exec backend python manage.py migrate

# Create superuser
docker-compose -f docker-compose.prod.yml exec backend python manage.py createsuperuser

# Collect static files
docker-compose -f docker-compose.prod.yml exec backend python manage.py collectstatic --noinput
```

## 🌐 Access Points

After successful deployment, your application will be available at:

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000/api
- **Admin Panel**: http://localhost:8000/admin
- **Nginx Proxy**: http://localhost:80

## 🔒 Security Considerations

### 1. Change Default Passwords

- Update `POSTGRES_PASSWORD` in `.env.prod`
- Change the default admin password after first login
- Use strong, unique passwords

### 2. SSL/HTTPS Setup

For production with SSL, uncomment and configure the HTTPS server in `nginx/conf.d/default.conf`:

```nginx
server {
    listen 443 ssl http2;
    server_name your-domain.com;
    
    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;
    # ... other SSL settings
}
```

### 3. Firewall Configuration

Ensure only necessary ports are open:
- Port 80 (HTTP)
- Port 443 (HTTPS)
- Port 22 (SSH) - if accessing server directly

## 📊 Monitoring and Maintenance

### View Logs

```bash
# All services
docker-compose -f docker-compose.prod.yml logs -f

# Specific service
docker-compose -f docker-compose.prod.yml logs -f backend
docker-compose -f docker-compose.prod.yml logs -f frontend
docker-compose -f docker-compose.prod.yml logs -f nginx
```

### Health Checks

All services include health checks. Monitor them with:

```bash
docker-compose -f docker-compose.prod.yml ps
```

### Database Backup

```bash
# Backup PostgreSQL database
docker-compose -f docker-compose.prod.yml exec db pg_dump -U auctionuser auctionflow > backup.sql

# Restore from backup
docker-compose -f docker-compose.prod.yml exec -T db psql -U auctionuser auctionflow < backup.sql
```

## 🔄 Updates and Scaling

### Update Application

```bash
# Pull latest code
git pull origin main

# Rebuild and restart
docker-compose -f docker-compose.prod.yml up --build -d
```

### Scale Services

```bash
# Scale backend workers
docker-compose -f docker-compose.prod.yml up -d --scale backend=3

# Scale frontend instances
docker-compose -f docker-compose.prod.yml up -d --scale frontend=2
```

## 🚨 Troubleshooting

### Common Issues

1. **Port Conflicts**: Ensure ports 80, 3000, 8000, 5432, 6379 are available
2. **Permission Issues**: Check file permissions for `.env.prod` and nginx configs
3. **Database Connection**: Verify PostgreSQL is running and credentials are correct
4. **Memory Issues**: Ensure sufficient RAM for all services (minimum 4GB recommended)

### Reset Everything

```bash
# Stop and remove all containers, networks, and volumes
docker-compose -f docker-compose.prod.yml down -v

# Remove all images
docker system prune -a

# Start fresh
./deploy-prod.sh
```

## 📈 Production Optimizations

### 1. Performance Tuning

- Adjust Nginx worker processes based on CPU cores
- Configure PostgreSQL connection pooling
- Enable Redis caching for Django
- Use CDN for static assets

### 2. Backup Strategy

- Automated database backups
- File system snapshots
- Off-site backup storage
- Regular backup testing

### 3. Monitoring

- Set up application monitoring (e.g., Prometheus, Grafana)
- Configure log aggregation
- Set up alerting for critical issues
- Monitor resource usage

## 🎯 Next Steps

1. **Domain Configuration**: Point your domain to your server's IP
2. **SSL Certificate**: Obtain and configure SSL certificates
3. **Monitoring Setup**: Implement comprehensive monitoring
4. **Backup Automation**: Set up automated backup processes
5. **Load Balancing**: Consider load balancer for high availability

## 📞 Support

If you encounter issues during deployment:

1. Check the logs: `docker-compose -f docker-compose.prod.yml logs -f`
2. Verify environment variables in `.env.prod`
3. Ensure all required ports are available
4. Check Docker and Docker Compose versions

---

**Happy Deploying! 🚀**
