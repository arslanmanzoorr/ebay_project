# Bidsquire Windows Deployment Script (No Docker - Connect to Server DB)
# This script deploys the Next.js frontend connecting to the server database

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Bidsquire Deployment (Windows)" -ForegroundColor Cyan
Write-Host "  Frontend Only - Server Database" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

cd project

# Create .env.local to connect to server database
Write-Host "Creating .env.local file..." -ForegroundColor Yellow
$envLocalContent = @"
# Database Configuration (Server)
DB_HOST=108.181.167.171
DB_PORT=5432
DB_NAME=auctionflow
DB_USER=auctionuser
DB_PASSWORD=auctionpass
DB_SSL=false

# Application Configuration
NEXT_PUBLIC_API_URL=http://localhost:3000
NODE_ENV=development
"@
$envLocalContent | Out-File -FilePath ".env.local" -Encoding UTF8 -Force
Write-Host "OK .env.local file created (connecting to server DB)" -ForegroundColor Green

# Check if node_modules exists
if (!(Test-Path "node_modules")) {
    Write-Host ""
    Write-Host "Installing dependencies..." -ForegroundColor Yellow
    npm install
    Write-Host "OK Dependencies installed" -ForegroundColor Green
}

# Start the development server
Write-Host ""
Write-Host "Starting Next.js development server..." -ForegroundColor Yellow
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Deployment Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Database:" -ForegroundColor Cyan
Write-Host "  - Connected to server: 108.181.167.171:5432" -ForegroundColor White
Write-Host "  - Database: auctionflow" -ForegroundColor White
Write-Host "  - User: auctionuser" -ForegroundColor White
Write-Host ""
Write-Host "Frontend:" -ForegroundColor Cyan
Write-Host "  - Starting on http://localhost:3000" -ForegroundColor White
Write-Host "  - Press Ctrl+C to stop the server" -ForegroundColor White
Write-Host ""
Write-Host "Super Admin Credentials:" -ForegroundColor Cyan
Write-Host "  - Email: superadmin@auctionflow.com" -ForegroundColor White
Write-Host "  - Password: SuperAdmin@2024!" -ForegroundColor White
Write-Host ""
Write-Host "Admin Credentials:" -ForegroundColor Cyan
Write-Host "  - Email: admin@auctionflow.com" -ForegroundColor White
Write-Host "  - Password: Admin@bids25" -ForegroundColor White
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

# Start the dev server
npm run dev

