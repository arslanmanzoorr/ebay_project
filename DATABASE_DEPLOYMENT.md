# Database-Only Deployment Guide

This guide helps you deploy only the PostgreSQL database container on Ubuntu, while hosting nginx separately.

## 🚀 Quick Start

### 1. Run the Deployment Script
```bash
# Make the script executable
chmod +x deploy-database-only.sh

# Run the deployment
./deploy-database-only.sh
```

### 2. Manual Deployment (Alternative)
If you prefer manual deployment:

```bash
# Copy environment variables
cp database.env .env

# Start database only
docker-compose -f docker-compose.db-only.yml up -d

# Check if database is running
docker ps
```

## 📊 Database Information

### Connection Details
- **Host**: localhost
- **Port**: 5432
- **Database**: auctionflow
- **Username**: auctionuser
- **Password**: AuctionFlow2024!

### Default Users Created
- **Super Admin**: `superadmin@auctionflow.com` / `SuperAdmin@2024!`
- **Admin**: `admin@auctionflow.com` / `Admin@bids25`

### Credit Settings
- **Item Fetch Cost**: 1 credit
- **Research2 Cost**: 2 credits
- **Initial Admin Credits**: 60 credits

## 🛠️ Management Commands

### Start Database
```bash
./start-database.sh
# or
docker-compose -f docker-compose.db-only.yml up -d
```

### Stop Database
```bash
./stop-database.sh
# or
docker-compose -f docker-compose.db-only.yml down
```

### Restart Database
```bash
./restart-database.sh
# or
docker-compose -f docker-compose.db-only.yml restart
```

### Backup Database
```bash
./backup-database.sh
```

### View Database Logs
```bash
docker logs ebay_project_postgres_1
```

### Connect to Database
```bash
docker exec -it ebay_project_postgres_1 psql -U auctionuser -d auctionflow
```

## 🔧 Configuration for Next.js App

### Environment Variables
Add these to your Next.js application's `.env.local`:

```bash
DATABASE_URL=postgresql://auctionuser:AuctionFlow2024!@localhost:5432/auctionflow
NEXTAUTH_SECRET=your-secret-key-here
NEXTAUTH_URL=http://your-domain.com
```

### Nginx Configuration Example
```nginx
server {
    listen 80;
    server_name your-domain.com;

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

## 🔍 Verification

### Check Database Status
```bash
# Check if container is running
docker ps | grep postgres

# Check database health
docker exec ebay_project_postgres_1 pg_isready -U auctionuser -d auctionflow

# Check tables
docker exec ebay_project_postgres_1 psql -U auctionuser -d auctionflow -c "\dt"
```

### Check Users
```bash
# Check if users were created
docker exec ebay_project_postgres_1 psql -U auctionuser -d auctionflow -c "SELECT name, email, role FROM users;"
```

### Check Credit Settings
```bash
# Check credit settings
docker exec ebay_project_postgres_1 psql -U auctionuser -d auctionflow -c "SELECT * FROM credit_settings;"
```

## 🚨 Troubleshooting

### Database Won't Start
```bash
# Check logs
docker logs ebay_project_postgres_1

# Check if port is in use
sudo netstat -tlnp | grep 5432

# Remove and recreate
docker-compose -f docker-compose.db-only.yml down
docker volume rm ebay_project_postgres_data
docker-compose -f docker-compose.db-only.yml up -d
```

### Connection Issues
```bash
# Test connection
docker exec ebay_project_postgres_1 psql -U auctionuser -d auctionflow -c "SELECT version();"

# Check network
docker network ls
docker network inspect ebay_project_default
```

### Permission Issues
```bash
# Fix file permissions
sudo chown -R $USER:$USER .
chmod +x *.sh
```

## 📁 Files Created

After running the deployment script, you'll have:

- `docker-compose.db-only.yml` - Database configuration
- `.env` - Environment variables
- `start-database.sh` - Start script
- `stop-database.sh` - Stop script
- `restart-database.sh` - Restart script
- `backup-database.sh` - Backup script

## 🔒 Security Notes

1. **Change Default Passwords**: Update the database password in production
2. **Firewall**: Configure Ubuntu firewall to only allow necessary ports
3. **SSL**: Use SSL certificates for your nginx configuration
4. **Backups**: Set up regular database backups
5. **Monitoring**: Monitor database performance and logs

## 📞 Support

If you encounter issues:
1. Check the logs: `docker logs ebay_project_postgres_1`
2. Verify the database is healthy: `docker exec ebay_project_postgres_1 pg_isready -U auctionuser -d auctionflow`
3. Check the troubleshooting section above
4. Contact support if problems persist
