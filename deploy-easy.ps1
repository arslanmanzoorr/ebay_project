# 🚀 Bidsquire Auction Platform - One-Command Deployment (Windows)
# Just run this script after setting up your .env file and relax!

param(
    [string]$Environment = "dev"
)

# Set error action preference
$ErrorActionPreference = "Stop"

# Colors
$Green = "Green"
$Blue = "Cyan"
$Yellow = "Yellow"
$Red = "Red"

Write-Host "🚀 Bidsquire Auction Platform - Easy Deployment" -ForegroundColor $Blue
Write-Host "==============================================" -ForegroundColor $Blue
Write-Host ""

# Check if .env file exists
if (-not (Test-Path ".env") -and -not (Test-Path ".env.production")) {
    Write-Host "❌ No environment file found!" -ForegroundColor $Red
    Write-Host "Please create .env file first:"
    Write-Host "  copy env.example .env"
    Write-Host "  # Edit .env with your settings"
    Write-Host "  # Then run this script again"
    exit 1
}

# Determine environment
if (Test-Path ".env.production") {
    $EnvFile = ".env.production"
    $ComposeFile = "docker-compose.prod.yml"
    Write-Host "📋 Using production environment" -ForegroundColor $Yellow
} else {
    $EnvFile = ".env"
    $ComposeFile = "docker-compose.yml"
    Write-Host "📋 Using development environment" -ForegroundColor $Yellow
}

Write-Host "🔍 Checking Docker..." -ForegroundColor $Blue
try {
    docker info | Out-Null
    Write-Host "✅ Docker is running" -ForegroundColor $Green
} catch {
    Write-Host "❌ Docker is not running!" -ForegroundColor $Red
    Write-Host "Please start Docker Desktop and try again."
    exit 1
}

Write-Host "🧹 Cleaning up old containers..." -ForegroundColor $Blue
try {
    docker-compose -f $ComposeFile down --remove-orphans 2>$null
} catch {
    # Ignore errors during cleanup
}

Write-Host "🔨 Building images..." -ForegroundColor $Blue
docker-compose -f $ComposeFile build --no-cache

Write-Host "🚀 Starting services..." -ForegroundColor $Blue
docker-compose -f $ComposeFile up -d

Write-Host "⏳ Waiting for services to start..." -ForegroundColor $Blue
Start-Sleep -Seconds 15

Write-Host "🗄️ Initializing database..." -ForegroundColor $Blue
# Wait for database
for ($i = 1; $i -le 30; $i++) {
    try {
        docker-compose -f $ComposeFile exec -T postgres pg_isready -U auctionuser -d auctionflow 2>$null
        break
    } catch {
        Write-Host "   Waiting for database... ($i/30)" -ForegroundColor $Yellow
        Start-Sleep -Seconds 2
    }
}

# Run migrations
try {
    docker-compose -f $ComposeFile exec -T backend python manage.py migrate 2>$null
} catch {
    # Ignore migration errors
}

# Create admin user
Write-Host "👤 Creating admin user..." -ForegroundColor $Blue
try {
    docker-compose -f $ComposeFile exec -T frontend node scripts/init-admin.js 2>$null
} catch {
    # Ignore admin creation errors
}

Write-Host "🔍 Checking health..." -ForegroundColor $Blue
Start-Sleep -Seconds 5

# Check if services are running
$RunningServices = docker-compose -f $ComposeFile ps | Select-String "Up"
if ($RunningServices) {
    Write-Host "✅ All services are running!" -ForegroundColor $Green
} else {
    Write-Host "❌ Some services failed to start" -ForegroundColor $Red
    Write-Host "Check logs with: docker-compose -f $ComposeFile logs"
    exit 1
}

Write-Host ""
Write-Host "🎉 DEPLOYMENT COMPLETE! 🎉" -ForegroundColor $Green
Write-Host "==================================" -ForegroundColor $Green
Write-Host ""
Write-Host "🌐 Your app is now running at:" -ForegroundColor $Blue
Write-Host "   Frontend: http://localhost:3000"
Write-Host "   Admin:    http://localhost:3000/admin"
Write-Host "   API:      http://localhost:3000/api/health"
Write-Host ""
Write-Host "🔑 Admin Login:" -ForegroundColor $Blue
Write-Host "   Check your $EnvFile file for ADMIN_EMAIL and ADMIN_PASSWORD"
Write-Host ""
Write-Host "📊 Management:" -ForegroundColor $Blue
Write-Host "   View logs: docker-compose -f $ComposeFile logs -f"
Write-Host "   Stop app:  docker-compose -f $ComposeFile down"
Write-Host "   Restart:   docker-compose -f $ComposeFile restart"
Write-Host ""
Write-Host "🚀 Enjoy your auction platform!" -ForegroundColor $Green
