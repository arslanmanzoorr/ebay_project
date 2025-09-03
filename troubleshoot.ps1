# Troubleshooting script for deployment issues
Write-Host "🔍 Troubleshooting deployment issues..." -ForegroundColor Green

# Check Docker status
Write-Host "`n📊 Docker Status:" -ForegroundColor Yellow
docker --version
docker-compose --version

# Check running containers
Write-Host "`n🐳 Running Containers:" -ForegroundColor Yellow
docker ps -a

# Check images
Write-Host "`n🖼️ Docker Images:" -ForegroundColor Yellow
docker images | grep ebay_project

# Check logs
Write-Host "`n📋 Frontend Logs (last 20 lines):" -ForegroundColor Yellow
docker-compose -f docker-compose.prod.yml logs frontend --tail=20

# Check nginx logs
Write-Host "`n🌐 Nginx Logs (last 10 lines):" -ForegroundColor Yellow
docker-compose -f docker-compose.prod.yml logs nginx --tail=10

# Check file permissions
Write-Host "`n📁 File Permissions:" -ForegroundColor Yellow
if (Test-Path "./project/public/uploads") {
    Get-ChildItem "./project/public/uploads" | Select-Object Name, Length, LastWriteTime
} else {
    Write-Host "Uploads directory does not exist" -ForegroundColor Red
}

# Check database file
Write-Host "`n🗄️ Database Status:" -ForegroundColor Yellow
if (Test-Path "./project/webhook_data.db") {
    $dbSize = (Get-Item "./project/webhook_data.db").Length
    Write-Host "Database file exists: $dbSize bytes" -ForegroundColor Green
} else {
    Write-Host "Database file does not exist (will be created automatically)" -ForegroundColor Yellow
}

# Test API endpoints
Write-Host "`n🌐 Testing API Endpoints:" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/api/health" -TimeoutSec 5
    Write-Host "Health endpoint: $($response.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "Health endpoint: Failed - $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n✅ Troubleshooting complete!" -ForegroundColor Green
