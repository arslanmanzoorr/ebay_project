# Test PostgreSQL deployment script
Write-Host "🧪 Testing PostgreSQL Deployment..." -ForegroundColor Green

# Run the migration
Write-Host "Running migration to PostgreSQL..." -ForegroundColor Yellow
.\migrate-to-postgres.ps1

# Wait a bit for everything to settle
Write-Host "Waiting for services to stabilize..." -ForegroundColor Yellow
Start-Sleep -Seconds 15

# Test the login API
Write-Host "Testing login API..." -ForegroundColor Yellow
try {
    $loginResponse = Invoke-RestMethod -Uri "http://localhost/api/auth/login" -Method POST -ContentType "application/json" -Body '{"email":"admin@bidsquire.com","password":"Admin@bids25"}'
    
    if ($loginResponse.success) {
        Write-Host "✅ Login API working!" -ForegroundColor Green
        Write-Host "User: $($loginResponse.user.name)" -ForegroundColor Cyan
        Write-Host "Role: $($loginResponse.user.role)" -ForegroundColor Cyan
    } else {
        Write-Host "❌ Login API failed!" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Login API error: $($_.Exception.Message)" -ForegroundColor Red
}

# Test user listing API
Write-Host "Testing user listing API..." -ForegroundColor Yellow
try {
    $usersResponse = Invoke-RestMethod -Uri "http://localhost/api/users" -Method GET
    Write-Host "✅ Users API working! Found $($usersResponse.length) users" -ForegroundColor Green
    foreach ($user in $usersResponse) {
        Write-Host "  - $($user.name) ($($user.email)) - $($user.role)" -ForegroundColor Cyan
    }
} catch {
    Write-Host "❌ Users API error: $($_.Exception.Message)" -ForegroundColor Red
}

# Test database connection directly
Write-Host "Testing direct database connection..." -ForegroundColor Yellow
try {
    $dbTest = docker exec ebay_project-postgres-1 psql -U bidsquire_user -d bidsquire_dev -c "SELECT COUNT(*) as user_count FROM users;" -t
    Write-Host "✅ Database connection working! User count: $($dbTest.Trim())" -ForegroundColor Green
} catch {
    Write-Host "❌ Database connection error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "🎉 PostgreSQL deployment test complete!" -ForegroundColor Green
Write-Host "🌐 Access your app at: http://localhost" -ForegroundColor Cyan
Write-Host "🔐 Login with: admin@bidsquire.com / Admin@bids25" -ForegroundColor Cyan
