# Build Frontend Docker Image Script (Windows)
# This script builds a production-ready Docker image with all the latest changes

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Building Bidsquire Frontend Image" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Docker paths
$dockerPath = "E:\Docker\resources\bin\docker.exe"

# Check if Docker is available
Write-Host "Checking Docker installation..." -ForegroundColor Yellow
if (!(Test-Path $dockerPath)) {
    Write-Host "X Docker not found at: $dockerPath" -ForegroundColor Red
    exit 1
}

# Check if Docker is running
try {
    & $dockerPath ps | Out-Null
    Write-Host "OK Docker is running" -ForegroundColor Green
}
catch {
    Write-Host "X Docker is not running. Please start Docker Desktop first." -ForegroundColor Red
    exit 1
}

# Set image name and tag
$imageName = "bidsquire-frontend"
$imageTag = "latest"
$fullImageName = "${imageName}:${imageTag}"

Write-Host ""
Write-Host "Building Docker image: $fullImageName" -ForegroundColor Yellow
Write-Host "This may take several minutes..." -ForegroundColor Gray
Write-Host ""

# Build the Docker image
cd project
& $dockerPath build -f Dockerfile.prod -t $fullImageName .

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "  Build Successful!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Image Details:" -ForegroundColor Cyan
    Write-Host "  - Name: $fullImageName" -ForegroundColor White
    Write-Host ""
    
    # Get image size
    $imageInfo = & $dockerPath images $imageName --format "{{.Size}}" | Select-Object -First 1
    Write-Host "  - Size: $imageInfo" -ForegroundColor White
    Write-Host ""
    
    Write-Host "Next Steps:" -ForegroundColor Cyan
    Write-Host "  1. Save image: .\save-frontend-image.ps1" -ForegroundColor White
    Write-Host "  2. Transfer to server: scp bidsquire-frontend.tar user@server:~/" -ForegroundColor White
    Write-Host "  3. Load on server: docker load -i bidsquire-frontend.tar" -ForegroundColor White
    Write-Host "  4. Deploy: docker-compose up -d frontend" -ForegroundColor White
    Write-Host ""
    Write-Host "Or test locally:" -ForegroundColor Cyan
    Write-Host "  docker run -p 3000:3000 --env-file .env.local $fullImageName" -ForegroundColor White
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
}
else {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Red
    Write-Host "  Build Failed!" -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please check the error messages above and fix any issues." -ForegroundColor Yellow
    exit 1
}

cd ..

