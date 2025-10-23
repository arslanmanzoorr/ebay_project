# Complete Frontend Deployment to Server Script (Windows)
# This script builds, saves, and prepares the frontend for server deployment

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Bidsquire Frontend Server Deployment" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Configuration
$dockerPath = "E:\Docker\resources\bin\docker.exe"
$imageName = "bidsquire-frontend"
$imageTag = "latest"
$fullImageName = "${imageName}:${imageTag}"
$outputFile = "bidsquire-frontend.tar"
$serverUser = "administrator"
$serverIP = "108.181.167.171"
$serverPath = "~/bidsquire/ebay_project"

# Step 1: Check Docker
Write-Host "Step 1: Checking Docker..." -ForegroundColor Yellow
if (!(Test-Path $dockerPath)) {
    Write-Host "X Docker not found" -ForegroundColor Red
    exit 1
}

try {
    & $dockerPath ps | Out-Null
    Write-Host "OK Docker is running" -ForegroundColor Green
}
catch {
    Write-Host "X Docker is not running" -ForegroundColor Red
    exit 1
}

# Step 2: Build the image
Write-Host ""
Write-Host "Step 2: Building Docker image..." -ForegroundColor Yellow
Write-Host "This may take 5-10 minutes..." -ForegroundColor Gray
Write-Host ""

cd project
& $dockerPath build -f Dockerfile.prod -t $fullImageName .
cd ..

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "X Build failed" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "OK Image built successfully" -ForegroundColor Green

# Step 3: Save the image
Write-Host ""
Write-Host "Step 3: Saving image to file..." -ForegroundColor Yellow
& $dockerPath save -o $outputFile $fullImageName

if ($LASTEXITCODE -ne 0) {
    Write-Host "X Failed to save image" -ForegroundColor Red
    exit 1
}

$fileSize = (Get-Item $outputFile).Length / 1MB
$fileSizeFormatted = "{0:N2} MB" -f $fileSize
Write-Host "OK Image saved ($fileSizeFormatted)" -ForegroundColor Green

# Step 4: Create deployment instructions
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Build Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Image Details:" -ForegroundColor Cyan
Write-Host "  - Name: $fullImageName" -ForegroundColor White
Write-Host "  - File: $outputFile" -ForegroundColor White
Write-Host "  - Size: $fileSizeFormatted" -ForegroundColor White
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Deployment Instructions" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Transfer image to server:" -ForegroundColor Yellow
Write-Host "   scp $outputFile ${serverUser}@${serverIP}:~/" -ForegroundColor White
Write-Host ""
Write-Host "2. SSH into server:" -ForegroundColor Yellow
Write-Host "   ssh ${serverUser}@${serverIP}" -ForegroundColor White
Write-Host ""
Write-Host "3. On the server, run these commands:" -ForegroundColor Yellow
Write-Host ""
Write-Host "   # Stop current frontend" -ForegroundColor Gray
Write-Host "   cd $serverPath" -ForegroundColor White
Write-Host "   pm2 stop ebay-frontend" -ForegroundColor White
Write-Host "   pm2 delete ebay-frontend" -ForegroundColor White
Write-Host ""
Write-Host "   # Load new image" -ForegroundColor Gray
Write-Host "   docker load -i ~/$outputFile" -ForegroundColor White
Write-Host ""
Write-Host "   # Update docker-compose.yml to use the new image" -ForegroundColor Gray
Write-Host "   # Change 'build:' to 'image: $fullImageName'" -ForegroundColor Gray
Write-Host ""
Write-Host "   # Start with docker-compose" -ForegroundColor Gray
Write-Host "   docker-compose up -d frontend" -ForegroundColor White
Write-Host ""
Write-Host "   # Or run directly" -ForegroundColor Gray
Write-Host "   docker run -d --name bidsquire-frontend \"  -ForegroundColor White
Write-Host "     -p 3000:3000 \"  -ForegroundColor White
Write-Host "     -e DB_HOST=postgres \"  -ForegroundColor White
Write-Host "     -e DB_PORT=5432 \"  -ForegroundColor White
Write-Host "     -e DB_NAME=auctionflow \"  -ForegroundColor White
Write-Host "     -e DB_USER=auctionuser \"  -ForegroundColor White
Write-Host "     -e DB_PASSWORD=auctionpass \"  -ForegroundColor White
Write-Host "     --network ebay_project_default \"  -ForegroundColor White
Write-Host "     $fullImageName" -ForegroundColor White
Write-Host ""
Write-Host "4. Verify deployment:" -ForegroundColor Yellow
Write-Host "   curl http://localhost:3000/api/health" -ForegroundColor White
Write-Host "   curl http://108.181.167.171:3000/api/health" -ForegroundColor White
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Changes Included in This Build:" -ForegroundColor Cyan
Write-Host "  OK Bidsquire logo added to navbar, login, and main page" -ForegroundColor White
Write-Host "  OK Duplicate 'Create eBay Draft' buttons fixed" -ForegroundColor White
Write-Host "  OK View Original Listing button code verified" -ForegroundColor White
Write-Host "  OK Database configuration uses environment variables" -ForegroundColor White
Write-Host "  OK Production-ready with health checks" -ForegroundColor White
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

