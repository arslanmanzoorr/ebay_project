# 🚀 Quick Deploy - Sit Back and Relax!

This is the simplest way to deploy your Bidsquire Auction Platform. Just follow these 3 steps:

## 📋 Prerequisites
- Docker Desktop installed and running
- Git (to clone the repository)

## ⚡ 3-Step Deployment

### Step 1: Setup Environment
```bash
# Copy the environment template
cp env.production.template .env.production

# Edit the file with your settings
notepad .env.production  # Windows
# or
nano .env.production     # Linux/Mac
```

**Required settings in .env.production:**
```bash
SECRET_KEY=your_generated_secret_key_here
POSTGRES_PASSWORD=your_secure_database_password
ADMIN_EMAIL=admin@yourcompany.com
ADMIN_PASSWORD=YourSecurePassword123!
```

### Step 2: Run One Command

**On Windows:**
```powershell
.\deploy-easy.ps1
```

**On Linux/Mac:**
```bash
./deploy-easy.sh
```

### Step 3: Relax! ☕
The script will:
- ✅ Check Docker is running
- ✅ Clean up old containers
- ✅ Build all images
- ✅ Start all services
- ✅ Initialize database
- ✅ Create admin user
- ✅ Check everything is working

## 🎉 That's It!

Your app will be running at:
- **Frontend**: http://localhost:3000
- **Admin Panel**: http://localhost:3000/admin

**Login with the admin credentials you set in Step 1!**

## 🔧 Management Commands

```bash
# View logs
docker-compose -f docker-compose.prod.yml logs -f

# Stop the app
docker-compose -f docker-compose.prod.yml down

# Restart the app
docker-compose -f docker-compose.prod.yml restart
```

## 🆘 If Something Goes Wrong

1. **Docker not running**: Start Docker Desktop
2. **Port conflicts**: Stop other apps using ports 3000, 8000, 5432
3. **Permission errors**: Run as Administrator (Windows) or with sudo (Linux/Mac)
4. **Check logs**: `docker-compose -f docker-compose.prod.yml logs`

---

**That's it! Your auction platform is ready to go! 🚀**
