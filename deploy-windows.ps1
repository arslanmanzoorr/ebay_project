# Bidsquire Windows Deployment Script
# This script deploys both PostgreSQL database and Next.js frontend locally

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Bidsquire Deployment (Windows)" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Docker is running
Write-Host "Checking Docker status..." -ForegroundColor Yellow
try {
    docker ps | Out-Null
    Write-Host "OK Docker is running" -ForegroundColor Green
}
catch {
    Write-Host "X Docker is not running. Please start Docker Desktop first." -ForegroundColor Red
    exit 1
}

# Stop existing containers
Write-Host ""
Write-Host "Stopping existing containers..." -ForegroundColor Yellow
docker-compose down --remove-orphans 2>$null

# Stop PM2 processes if running
Write-Host ""
Write-Host "Checking for PM2 processes..." -ForegroundColor Yellow
cd project
if (Get-Command pm2 -ErrorAction SilentlyContinue) {
    pm2 delete all 2>$null
    Write-Host "OK PM2 processes stopped" -ForegroundColor Green
}
else {
    Write-Host "PM2 not found, skipping..." -ForegroundColor Gray
}
cd ..

# Start PostgreSQL Database
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Starting PostgreSQL Database" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Create .env file if it doesn't exist
if (!(Test-Path ".env")) {
    Write-Host "Creating .env file..." -ForegroundColor Yellow
    $envContent = @"
POSTGRES_USER=auctionuser
POSTGRES_PASSWORD=auctionpass
POSTGRES_DB=auctionflow
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
"@
    $envContent | Out-File -FilePath ".env" -Encoding UTF8
    Write-Host "OK .env file created" -ForegroundColor Green
}

# Start database container
Write-Host "Starting PostgreSQL container..." -ForegroundColor Yellow
docker-compose up -d postgres

# Wait for database to be ready
Write-Host "Waiting for database to be ready..." -ForegroundColor Yellow
$maxAttempts = 30
$attempt = 0
$dbReady = $false

while ($attempt -lt $maxAttempts -and !$dbReady) {
    Start-Sleep -Seconds 2
    $attempt++
    
    try {
        $result = docker exec ebay_project_postgres_1 pg_isready -U auctionuser -d auctionflow 2>$null
        if ($result -match "accepting connections") {
            $dbReady = $true
            Write-Host "OK Database is ready!" -ForegroundColor Green
        }
    }
    catch {
        Write-Host "." -NoNewline -ForegroundColor Gray
    }
}

if (!$dbReady) {
    Write-Host ""
    Write-Host "X Database failed to start. Please check Docker logs." -ForegroundColor Red
    exit 1
}

# Verify database initialization
Write-Host ""
Write-Host "Verifying database initialization..." -ForegroundColor Yellow
$tableCheck = docker exec ebay_project_postgres_1 psql -U auctionuser -d auctionflow -c "\dt" 2>$null

if ($tableCheck -match "users") {
    Write-Host "OK Database tables initialized successfully" -ForegroundColor Green
}
else {
    Write-Host "! Database tables not found, but database is running" -ForegroundColor Yellow
}

# Start Frontend
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Starting Next.js Frontend" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

cd project

# Create .env.local if it doesn't exist
if (!(Test-Path ".env.local")) {
    Write-Host "Creating .env.local file..." -ForegroundColor Yellow
    $envLocalContent = @"
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=auctionflow
DB_USER=auctionuser
DB_PASSWORD=auctionpass
DB_SSL=false

# Application Configuration
NEXT_PUBLIC_API_URL=http://localhost:3000
NODE_ENV=development
"@
    $envLocalContent | Out-File -FilePath ".env.local" -Encoding UTF8
    Write-Host "OK .env.local file created" -ForegroundColor Green
}

# Install dependencies if node_modules doesn't exist
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
Write-Host "  - PostgreSQL is running on localhost:5432" -ForegroundColor White
Write-Host "  - Database: auctionflow" -ForegroundColor White
Write-Host "  - User: auctionuser" -ForegroundColor White
Write-Host ""
Write-Host "Frontend:" -ForegroundColor Cyan
Write-Host "  - Starting on http://localhost:3000" -ForegroundColor White
Write-Host "  - Press Ctrl+C to stop the server" -ForegroundColor White
Write-Host ""
Write-Host "Default Admin Credentials:" -ForegroundColor Cyan
Write-Host "  - Email: admin@auctionflow.com" -ForegroundColor White
Write-Host "  - Password: Admin@bids25" -ForegroundColor White
Write-Host ""
Write-Host "Super Admin Credentials:" -ForegroundColor Cyan
Write-Host "  - Email: superadmin@auctionflow.com" -ForegroundColor White
Write-Host "  - Password: SuperAdmin@2024!" -ForegroundColor White
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

# Start the dev server
npm run dev
