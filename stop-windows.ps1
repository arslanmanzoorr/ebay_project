# Bidsquire Windows Stop Script
# This script stops all Bidsquire services

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Stopping Bidsquire Services" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Stop Docker containers
Write-Host "Stopping Docker containers..." -ForegroundColor Yellow
docker-compose down --remove-orphans

Write-Host "✓ All services stopped" -ForegroundColor Green
Write-Host ""

