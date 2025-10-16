# AuctionFlow Database Initialization Script (Windows PowerShell)
# This script properly initializes the database and cleans up everything else

param(
    [switch]$Force
)

Write-Host "🚀 Starting AuctionFlow Database Initialization..." -ForegroundColor Blue

# Function to print colored output
function Write-Status {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Blue
}

function Write-Success {
    param([string]$Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "[WARNING] $Message" -ForegroundColor Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

# Check if Docker is running
try {
    docker info | Out-Null
} catch {
    Write-Error "Docker is not running. Please start Docker Desktop first."
    exit 1
}

# Check if docker-compose is available
try {
    docker-compose --version | Out-Null
} catch {
    Write-Error "docker-compose is not installed. Please install docker-compose first."
    exit 1
}

# Create .env file if it doesn't exist
if (-not (Test-Path ".env")) {
    Write-Status "Creating .env file..."
    @"
POSTGRES_DB=auctionflow
POSTGRES_USER=auctionuser
POSTGRES_PASSWORD=auctionpass
ADMIN_NAME=Bidsquire Admin
ADMIN_EMAIL=admin@bidsquire.com
ADMIN_PASSWORD=Admin@bids25
NEXT_PUBLIC_API_URL=http://localhost:3000/api
"@ | Out-File -FilePath ".env" -Encoding UTF8
    Write-Success ".env file created"
} else {
    Write-Warning ".env file already exists, skipping creation"
}

# Stop any existing containers
Write-Status "Stopping any existing containers..."
docker-compose -f docker-compose.prod.yml down -v 2>$null

# Remove any existing volumes to ensure clean start
Write-Status "Removing existing volumes for clean initialization..."
docker volume rm ebay_project_postgres_data 2>$null

# Start the database container
Write-Status "Starting PostgreSQL database container..."
docker-compose -f docker-compose.prod.yml --env-file .env up -d postgres

# Wait for database to be ready
Write-Status "Waiting for database to initialize..."
Start-Sleep -Seconds 15

# Check if database is ready
Write-Status "Checking database connection..."
$maxAttempts = 30
$attempt = 1

while ($attempt -le $maxAttempts) {
    try {
        docker exec ebay_project_postgres_1 pg_isready -U auctionuser -d auctionflow 2>$null
        if ($LASTEXITCODE -eq 0) {
            Write-Success "Database is ready!"
            break
        }
    } catch {
        # Continue to next attempt
    }
    
    if ($attempt -eq $maxAttempts) {
        Write-Error "Database failed to start after $maxAttempts attempts"
        Write-Error "Checking database logs..."
        docker logs ebay_project_postgres_1
        exit 1
    }
    
    Write-Status "Attempt $attempt/$maxAttempts - waiting for database..."
    Start-Sleep -Seconds 2
    $attempt++
}

# Verify database initialization
Write-Status "Verifying database initialization..."
try {
    docker exec ebay_project_postgres_1 psql -U auctionuser -d auctionflow -c "SELECT COUNT(*) FROM users;" 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Database tables created successfully"
    } else {
        throw "Database query failed"
    }
} catch {
    Write-Error "Database initialization failed"
    Write-Error "Checking database logs..."
    docker logs ebay_project_postgres_1
    exit 1
}

# Show created users
Write-Status "Created users:"
docker exec ebay_project_postgres_1 psql -U auctionuser -d auctionflow -c "SELECT name, email, role FROM users;"

# Show credit settings
Write-Status "Credit settings:"
docker exec ebay_project_postgres_1 psql -U auctionuser -d auctionflow -c "SELECT setting_name, setting_value, description FROM credit_settings;"

Write-Success "Database initialization completed successfully!"
Write-Success "You can now start the frontend container with:"
Write-Success "docker run -d --name ebay-frontend --env-file .env --network ebay_project_app-network -p 3000:3000 -v `$(pwd)/project/public/uploads:/app/public/uploads --restart unless-stopped ebay-frontend:pc-build"

Write-Host ""
Write-Status "Database is running on port 5432"
Write-Status "Admin credentials: admin@auctionflow.com / Admin@bids25"
Write-Status "Super Admin credentials: superadmin@auctionflow.com / SuperAdmin@2024!"
Write-Host ""
Write-Status "To view database logs: docker logs ebay_project_postgres_1"
Write-Status "To connect to database: docker exec -it ebay_project_postgres_1 psql -U auctionuser -d auctionflow"
