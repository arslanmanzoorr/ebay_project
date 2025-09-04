# Migration script from SQLite to PostgreSQL (PowerShell)
Write-Host "🔄 Migrating from SQLite to PostgreSQL..." -ForegroundColor Green

# Stop current containers
Write-Host "Stopping current containers..." -ForegroundColor Yellow
docker-compose -f docker-compose.dev.yml down

# Remove old volumes to start fresh
Write-Host "Removing old volumes..." -ForegroundColor Yellow
docker volume rm ebay_project_postgres_dev_data 2>$null

# Start with PostgreSQL
Write-Host "Starting PostgreSQL containers..." -ForegroundColor Yellow
docker-compose -f docker-compose.dev.yml up -d postgres

# Wait for PostgreSQL to be ready
Write-Host "Waiting for PostgreSQL to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Check if PostgreSQL is ready
do {
    Write-Host "Waiting for PostgreSQL..."
    Start-Sleep -Seconds 2
} while (-not (docker exec ebay_project-postgres-1 pg_isready -U bidsquire_user -d bidsquire_dev 2>$null))

Write-Host "✅ PostgreSQL is ready!" -ForegroundColor Green

# Start the frontend
Write-Host "Starting frontend with PostgreSQL..." -ForegroundColor Yellow
docker-compose -f docker-compose.dev.yml up -d frontend

# Wait for frontend to be ready
Write-Host "Waiting for frontend to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Test the connection and verify tables
Write-Host "Testing PostgreSQL connection..." -ForegroundColor Yellow
Write-Host "Checking if tables exist..." -ForegroundColor Yellow
docker exec ebay_project-postgres-1 psql -U bidsquire_user -d bidsquire_dev -c "\dt"

Write-Host "Checking admin user..." -ForegroundColor Yellow
docker exec ebay_project-postgres-1 psql -U bidsquire_user -d bidsquire_dev -c "SELECT id, name, email, role FROM users WHERE email = 'admin@bidsquire.com';"

Write-Host "🎉 Migration to PostgreSQL complete!" -ForegroundColor Green
Write-Host "🌐 Access your app at: http://localhost" -ForegroundColor Cyan
Write-Host "🔐 Login with: admin@bidsquire.com / Admin@bids25" -ForegroundColor Cyan
