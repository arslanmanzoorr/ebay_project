# Restart Frontend Container (Windows)
# This script restarts the existing frontend container

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Restarting Bidsquire Frontend" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Docker path
$dockerPath = "E:\Docker\resources\bin\docker.exe"

# Find the frontend container
$containerName = & $dockerPath ps -a --format "{{.Names}}" | Select-String -Pattern "frontend|bidsquire" | Select-Object -First 1

if ($null -eq $containerName) {
    Write-Host "X No frontend container found" -ForegroundColor Red
    Write-Host ""
    Write-Host "Available containers:" -ForegroundColor Yellow
    & $dockerPath ps -a --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
    exit 1
}

$containerName = $containerName.ToString().Trim()
Write-Host "Found container: $containerName" -ForegroundColor Green
Write-Host ""

# Restart the container
Write-Host "Restarting container..." -ForegroundColor Yellow
& $dockerPath restart $containerName

if ($LASTEXITCODE -eq 0) {
    Write-Host "OK Container restarted successfully" -ForegroundColor Green
    
    # Wait for it to be ready
    Write-Host ""
    Write-Host "Waiting for frontend to be ready..." -ForegroundColor Yellow
    for ($i = 1; $i -le 30; $i++) {
        try {
            $response = Invoke-WebRequest -Uri "http://localhost:3000/api/health" -UseBasicParsing -TimeoutSec 2 2>$null
            if ($response.StatusCode -eq 200) {
                Write-Host ""
                Write-Host "OK Frontend is ready!" -ForegroundColor Green
                break
            }
        } catch {
            Write-Host "." -NoNewline -ForegroundColor Gray
            Start-Sleep -Seconds 2
        }
    }
    
    Write-Host ""
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "  Restart Complete!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Frontend Information:" -ForegroundColor Cyan
    Write-Host "  - URL: http://localhost:3000" -ForegroundColor White
    Write-Host "  - Container: $containerName" -ForegroundColor White
    Write-Host ""
    Write-Host "Useful Commands:" -ForegroundColor Cyan
    Write-Host "  - View logs: E:\Docker\resources\bin\docker.exe logs $containerName" -ForegroundColor White
    Write-Host "  - Check status: E:\Docker\resources\bin\docker.exe ps | Select-String $containerName" -ForegroundColor White
    Write-Host ""
    Write-Host "Test in browser:" -ForegroundColor Cyan
    Write-Host "  http://localhost:3000" -ForegroundColor White
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
}
else {
    Write-Host "X Failed to restart container" -ForegroundColor Red
    exit 1
}

