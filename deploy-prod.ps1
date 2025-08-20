# Production Deployment Script for AuctionFlow (PowerShell)
Write-Host "🚀 Starting production deployment..." -ForegroundColor Green

# Load environment variables
if (Test-Path ".env.prod") {
    Get-Content ".env.prod" | ForEach-Object {
        if ($_ -match "^([^#][^=]+)=(.*)$") {
            $key = $matches[1].Trim()
            $value = $matches[2].Trim()
            Set-Variable -Name $key -Value $value -Scope Global
            Write-Host "   ✅ Loaded: $key" -ForegroundColor Gray
        }
    }
} else {
    Write-Host "❌ .env.prod file not found!" -ForegroundColor Red
    Write-Host "Please create .env.prod file first using: cp env.prod.template .env.prod" -ForegroundColor Yellow
    exit 1
}

# Stop and remove existing containers
Write-Host "🛑 Stopping existing containers..." -ForegroundColor Yellow
docker-compose down -v

# Clean up Docker system
Write-Host "🧹 Cleaning up Docker system..." -ForegroundColor Yellow
docker system prune -af
docker volume prune -f

# Build and start services
Write-Host "📦 Building and starting services..." -ForegroundColor Yellow
docker-compose up -d --build

# Wait for services to be ready
Write-Host "⏳ Waiting for services to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 30

# Check service health
Write-Host "🏥 Checking service health..." -ForegroundColor Yellow
docker-compose ps

# Run database migrations
Write-Host "🗄️ Running database migrations..." -ForegroundColor Yellow
docker-compose exec backend python manage.py migrate

# Create superuser if it doesn't exist
Write-Host "👤 Creating superuser with secure credentials..." -ForegroundColor Yellow
docker-compose exec backend python manage.py createsuperuser --noinput --username auctionflow_admin --email admin@auctionflow.com

# Set admin password
Write-Host "🔐 Setting secure admin password..." -ForegroundColor Yellow
docker-compose exec backend python manage.py shell -c "
from django.contrib.auth.models import User
try:
    user = User.objects.get(username='auctionflow_admin')
    user.set_password('auctionpass123')
    user.save()
    print('Admin password updated successfully')
except User.DoesNotExist:
    print('Admin user not found')
"

# Collect static files
Write-Host "📁 Collecting static files..." -ForegroundColor Yellow
docker-compose exec backend python manage.py collectstatic --noinput

Write-Host "✅ Production deployment completed successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "🌐 Your application is now running at:" -ForegroundColor Cyan
Write-Host "   Frontend: http://localhost:3000" -ForegroundColor White
Write-Host "   Backend API: http://localhost:8000/api" -ForegroundColor White
Write-Host "   Admin: http://localhost:8000/admin" -ForegroundColor White
Write-Host ""
Write-Host "🔐 Admin Login Credentials:" -ForegroundColor Cyan
Write-Host "   Username: auctionflow_admin" -ForegroundColor White
Write-Host "   Email: admin@auctionflow.com" -ForegroundColor White
Write-Host "   Password: auctionpass123" -ForegroundColor White
Write-Host ""
Write-Host "📊 To view logs: docker-compose logs -f" -ForegroundColor Gray
Write-Host "🛑 To stop: docker-compose down" -ForegroundColor Gray
Write-Host ""
Write-Host "⚠️  IMPORTANT: Change admin password after first login!" -ForegroundColor Red
