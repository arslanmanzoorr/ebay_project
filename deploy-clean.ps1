# Clean deployment script for Windows/PowerShell
Write-Host "🧹 Starting clean deployment process..." -ForegroundColor Green

# Step 1: Nuclear Docker cleanup
Write-Host "🔥 Nuclear Docker cleanup..." -ForegroundColor Yellow
docker-compose -f docker-compose.prod.yml down --volumes --remove-orphans 2>$null
docker container prune -f
docker image prune -a -f
docker volume prune -f
docker network prune -f
docker system prune -a --volumes --force
docker rmi $(docker images -q ebay_project*) 2>$null

# Step 2: Clean up host files
Write-Host "🧽 Cleaning up host files..." -ForegroundColor Yellow
if (Test-Path "./project/webhook_data.db") {
    Remove-Item "./project/webhook_data.db" -Force
}

# Ensure uploads directory exists
if (-not (Test-Path "./project/public/uploads")) {
    New-Item -ItemType Directory -Path "./project/public/uploads" -Force
}

# Step 3: Build and deploy
Write-Host "🚀 Building and deploying..." -ForegroundColor Yellow
docker-compose -f docker-compose.prod.yml build --no-cache
docker-compose -f docker-compose.prod.yml up -d

# Step 4: Check status
Write-Host "📊 Checking deployment status..." -ForegroundColor Yellow
Start-Sleep -Seconds 10
docker-compose -f docker-compose.prod.yml ps
docker-compose -f docker-compose.prod.yml logs frontend --tail=20

Write-Host "✅ Clean deployment complete!" -ForegroundColor Green
Write-Host "🌐 Your app should be available at: http://localhost:3000" -ForegroundColor Cyan
Write-Host "👤 Default admin login: admin@example.com / admin123" -ForegroundColor Cyan
