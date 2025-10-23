# Bidsquire Database Only Deployment Script (Windows)
# This script deploys only the PostgreSQL database container

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Bidsquire Database Deployment" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Docker paths
$dockerPath = "E:\Docker\resources\bin\docker.exe"
$dockerComposePath = "E:\Docker\resources\bin\docker-compose.exe"

# Check if Docker is available
Write-Host "Checking Docker installation..." -ForegroundColor Yellow
if (!(Test-Path $dockerPath)) {
    Write-Host "X Docker not found at: $dockerPath" -ForegroundColor Red
    Write-Host "Please update the script with the correct Docker path" -ForegroundColor Yellow
    exit 1
}

# Check if Docker is running
try {
    & $dockerPath ps | Out-Null
    Write-Host "OK Docker is running" -ForegroundColor Green
    $dockerVersion = & $dockerPath --version
    Write-Host "OK $dockerVersion" -ForegroundColor Gray
}
catch {
    Write-Host "X Docker is not running. Please start Docker Desktop first." -ForegroundColor Red
    exit 1
}

# Stop existing database containers
Write-Host ""
Write-Host "Stopping existing database containers..." -ForegroundColor Yellow
& $dockerPath stop ebay_project_postgres_1 2>$null
& $dockerPath rm ebay_project_postgres_1 2>$null
& $dockerPath stop ebay_project_db_1 2>$null
& $dockerPath rm ebay_project_db_1 2>$null
& $dockerPath stop ebay_project-db-1 2>$null
& $dockerPath rm ebay_project-db-1 2>$null
Write-Host "OK Existing containers removed" -ForegroundColor Green

# Create .env file if it doesn't exist
Write-Host ""
Write-Host "Setting up environment..." -ForegroundColor Yellow
if (!(Test-Path ".env")) {
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
else {
    Write-Host "OK .env file already exists" -ForegroundColor Green
}

# Start PostgreSQL Database
Write-Host ""
Write-Host "Starting PostgreSQL container..." -ForegroundColor Yellow
& $dockerComposePath up -d db

# Wait a moment for container to be created
Start-Sleep -Seconds 3

# Detect the actual container name
Write-Host ""
Write-Host "Detecting container name..." -ForegroundColor Yellow
$containerName = & $dockerPath ps -a --format "{{.Names}}" | Select-String -Pattern "db|postgres" | Select-Object -First 1
$containerName = $containerName.ToString().Trim()

if ([string]::IsNullOrEmpty($containerName)) {
    Write-Host "X Could not find database container" -ForegroundColor Red
    Write-Host ""
    Write-Host "Available containers:" -ForegroundColor Yellow
    & $dockerPath ps -a
    exit 1
}

Write-Host "OK Found container: $containerName" -ForegroundColor Green

# Wait for database to be ready
Write-Host ""
Write-Host "Waiting for database to initialize..." -ForegroundColor Yellow
$maxAttempts = 60
$attempt = 0
$dbReady = $false

Write-Host "This may take up to 2 minutes for first-time initialization..." -ForegroundColor Gray

while ($attempt -lt $maxAttempts -and !$dbReady) {
    Start-Sleep -Seconds 2
    $attempt++
    
    try {
        $result = & $dockerPath exec $containerName pg_isready -U auctionuser -d auctionflow 2>$null
        if ($result -match "accepting connections") {
            $dbReady = $true
        }
        else {
            Write-Host "." -NoNewline -ForegroundColor Gray
        }
    }
    catch {
        Write-Host "." -NoNewline -ForegroundColor Gray
    }
}

Write-Host ""

if (!$dbReady) {
    Write-Host ""
    Write-Host "X Database failed to start within timeout." -ForegroundColor Red
    Write-Host ""
    Write-Host "Checking container logs:" -ForegroundColor Yellow
    & $dockerPath logs $containerName --tail 20
    exit 1
}

Write-Host "OK Database is ready!" -ForegroundColor Green

# Verify database initialization
Write-Host ""
Write-Host "Verifying database initialization..." -ForegroundColor Yellow
Start-Sleep -Seconds 2

try {
    $tableCheck = & $dockerPath exec $containerName psql -U auctionuser -d auctionflow -c "\dt" 2>$null
    
    if ($tableCheck -match "users") {
        Write-Host "OK Database tables initialized successfully" -ForegroundColor Green
        
        # Count tables
        $tableCount = & $dockerPath exec $containerName psql -U auctionuser -d auctionflow -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>$null
        Write-Host "OK Found $($tableCount.Trim()) tables" -ForegroundColor Green
    }
    else {
        Write-Host "! Warning: Database tables not found" -ForegroundColor Yellow
        Write-Host "  The database is running but may need manual initialization" -ForegroundColor Yellow
    }
}
catch {
    Write-Host "! Warning: Could not verify table initialization" -ForegroundColor Yellow
}

# Check for existing users
Write-Host ""
Write-Host "Checking for existing users..." -ForegroundColor Yellow
try {
    $userCount = & $dockerPath exec $containerName psql -U auctionuser -d auctionflow -t -c "SELECT COUNT(*) FROM users;" 2>$null
    $count = $userCount.Trim()
    
    if ($count -gt 0) {
        Write-Host "OK Found $count existing user(s)" -ForegroundColor Green
    }
    else {
        Write-Host "! No users found - you may need to create an admin user" -ForegroundColor Yellow
    }
}
catch {
    Write-Host "! Could not check user count" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Database Deployment Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Database Information:" -ForegroundColor Cyan
Write-Host "  - Host: localhost" -ForegroundColor White
Write-Host "  - Port: 5432" -ForegroundColor White
Write-Host "  - Database: auctionflow" -ForegroundColor White
Write-Host "  - User: auctionuser" -ForegroundColor White
Write-Host "  - Password: auctionpass" -ForegroundColor White
Write-Host ""
Write-Host "Container Name:" -ForegroundColor Cyan
Write-Host "  - $containerName" -ForegroundColor White
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "  1. Deploy frontend: npm run dev in the project folder" -ForegroundColor White
Write-Host "  2. Or connect your application to localhost:5432" -ForegroundColor White
Write-Host ""
Write-Host "Useful Commands:" -ForegroundColor Cyan
Write-Host "  - Check status: E:\Docker\resources\bin\docker.exe ps" -ForegroundColor White
Write-Host "  - View logs: E:\Docker\resources\bin\docker.exe logs $containerName" -ForegroundColor White
Write-Host "  - Stop database: E:\Docker\resources\bin\docker.exe stop $containerName" -ForegroundColor White
Write-Host "  - Connect to DB: E:\Docker\resources\bin\docker.exe exec -it $containerName psql -U auctionuser -d auctionflow" -ForegroundColor White
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
