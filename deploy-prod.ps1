# Production Deployment Script for AuctionFlow (Windows PowerShell)
param(
    [switch]$SkipEnvCheck
)

Write-Host "🚀 Starting production deployment..." -ForegroundColor Green

# Check if .env.prod exists
if (-not (Test-Path ".env.prod")) {
    Write-Host "❌ Error: .env.prod file not found!" -ForegroundColor Red
    Write-Host "Please copy env.prod.template to .env.prod and update the values" -ForegroundColor Yellow
    exit 1
}

# Load environment variables
Get-Content ".env.prod" | ForEach-Object {
    if ($_ -match "^([^#][^=]+)=(.*)$") {
        [Environment]::SetEnvironmentVariable($matches[1], $matches[2], "Process")
    }
}

# Check SECRET_KEY
if ($env:SECRET_KEY -eq "your-super-secret-key-change-this-in-production") {
    Write-Host "⚠️  Warning: Using default SECRET_KEY. Please change this in production!" -ForegroundColor Yellow
}

# Check admin credentials
if ($env:ADMIN_USERNAME -eq "auctionflow_admin" -and $env:ADMIN_PASSWORD -eq "AuCtIoNfLoW_2024_S3cur3!") {
    Write-Host "⚠️  Warning: Using default admin credentials. Please change these in production!" -ForegroundColor Yellow
}

# Stop existing containers
Write-Host "🛑 Stopping existing containers..." -ForegroundColor Yellow
docker-compose down

# Remove old images
Write-Host "🧹 Cleaning up old images..." -ForegroundColor Yellow
docker system prune -f

# Build and start services
Write-Host "🔨 Building and starting production services..." -ForegroundColor Yellow
docker-compose up --build -d

# Wait for services to be ready
Write-Host "⏳ Waiting for services to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 30

# Check service health
Write-Host "🏥 Checking service health..." -ForegroundColor Yellow
docker-compose ps

# Run Django migrations
Write-Host "🗄️  Running database migrations..." -ForegroundColor Yellow
docker-compose exec backend python manage.py migrate

# Create superuser with secure credentials
Write-Host "👤 Creating superuser with secure credentials..." -ForegroundColor Yellow
try {
    docker-compose exec -T backend python manage.py createsuperuser --username $env:ADMIN_USERNAME --email $env:ADMIN_EMAIL --noinput
} catch {
    Write-Host "Superuser already exists or creation failed" -ForegroundColor Yellow
}

# Set admin password securely
Write-Host "🔐 Setting secure admin password..." -ForegroundColor Yellow
$passwordScript = @"
from django.contrib.auth.models import User
try:
    user = User.objects.get(username='$env:ADMIN_USERNAME')
    user.set_password('$env:ADMIN_PASSWORD')
    user.save()
    print('Admin password updated successfully')
except User.DoesNotExist:
    print('Admin user not found')
"@

try {
    docker-compose exec -T backend python manage.py shell -c $passwordScript
} catch {
    Write-Host "Failed to set admin password" -ForegroundColor Red
}

# Collect static files
Write-Host "📁 Collecting static files..." -ForegroundColor Yellow
docker-compose exec backend python manage.py collectstatic --noinput

Write-Host "✅ Production deployment completed successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "🌐 Your application is now running at:" -ForegroundColor Cyan
Write-Host "   Frontend: http://localhost:3000" -ForegroundColor White
Write-Host "   Backend API: http://localhost:8000/api" -ForegroundColor White
Write-Host "   Admin: http://localhost:8000/admin" -ForegroundColor White
Write-Host "   Nginx: http://localhost:80" -ForegroundColor White
Write-Host ""
Write-Host "🔐 Admin Login Credentials:" -ForegroundColor Cyan
Write-Host "   Username: $env:ADMIN_USERNAME" -ForegroundColor White
Write-Host "   Email: $env:ADMIN_EMAIL" -ForegroundColor White
Write-Host "   Password: $env:ADMIN_PASSWORD" -ForegroundColor White
Write-Host ""
Write-Host "📊 To view logs: docker-compose logs -f" -ForegroundColor Cyan
Write-Host "🛑 To stop: docker-compose down" -ForegroundColor Cyan
Write-Host ""
Write-Host "⚠️  IMPORTANT: Change admin password after first login!" -ForegroundColor Yellow
