# 🚀 AuctionFlow Docker Deployment Guide

## 📋 Prerequisites

- Docker installed
- Docker Compose installed
- Git (to clone the repository)

## 🐳 Quick Start

### 1. Clone and Navigate
```bash
git clone <your-repo-url>
cd ebay_project
```

### 2. Set Environment Variables
```bash
cp env.example .env
# Edit .env with your actual values
```

### 3. Deploy Everything
```bash
chmod +x deploy.sh
./deploy.sh
```

## 🔧 Manual Deployment

### Build and Start Services
```bash
# Build all containers
docker-compose build

# Start services
docker-compose up -d

# Check status
docker-compose ps
```

### Database Setup
```bash
# Run migrations
docker-compose exec backend python manage.py migrate

# Create superuser
docker-compose exec backend python manage.py createsuperuser
```

## 🌐 Access Points

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000/api/
- **Database**: localhost:5432
- **Redis**: localhost:6379

## 📊 Service Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │   Database      │
│   (Next.js)     │◄──►│   (Django)      │◄──►│  (PostgreSQL)   │
│   Port: 3000    │    │   Port: 8000    │    │   Port: 5432    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│     Nginx       │    │     Redis       │    │   n8n Workflow  │
│   (Reverse      │    │   (Caching)     │    │   (External)    │
│    Proxy)       │    │   Port: 6379    │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🛠️ Management Commands

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
```

### Restart Services
```bash
# All services
docker-compose restart

# Specific service
docker-compose restart backend
```

### Stop Services
```bash
docker-compose down
```

### Update Services
```bash
docker-compose pull
docker-compose up -d
```

## 🔒 Security Considerations

1. **Change default passwords** in `.env`
2. **Use strong SECRET_KEY** for Django
3. **Limit ALLOWED_HOSTS** to your domain
4. **Enable HTTPS** in production
5. **Use environment variables** for sensitive data

## 📈 Production Deployment

### 1. Update Environment
```bash
# Set production values
DEBUG=False
ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com
SECRET_KEY=your-production-secret-key
```

### 2. Use Production Dockerfile
```bash
# Update docker-compose.yml to use Dockerfile.prod
backend:
  build:
    context: ./backend
    dockerfile: Dockerfile.prod
```

### 3. Add SSL/HTTPS
```bash
# Configure nginx with SSL certificates
# Update docker-compose.yml nginx service
```

### 4. Set Up Monitoring
```bash
# Add health checks
# Set up logging aggregation
# Configure backup strategies
```

## 🚨 Troubleshooting

### Common Issues

1. **Port conflicts**: Check if ports 3000, 8000, 5432 are available
2. **Database connection**: Ensure PostgreSQL container is running
3. **Permission issues**: Check file ownership and Docker user setup
4. **Memory issues**: Increase Docker memory allocation if needed

### Debug Commands
```bash
# Check container status
docker-compose ps

# Check container logs
docker-compose logs backend

# Access container shell
docker-compose exec backend bash

# Check database connection
docker-compose exec backend python manage.py dbshell
```

## 📚 Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Django Deployment Checklist](https://docs.djangoproject.com/en/stable/howto/deployment/checklist/)
- [Next.js Deployment](https://nextjs.org/docs/deployment)

## 🆘 Support

If you encounter issues:
1. Check the logs: `docker-compose logs -f`
2. Verify environment variables
3. Ensure all ports are available
4. Check Docker and Docker Compose versions
