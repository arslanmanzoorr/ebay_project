# Generate self-signed SSL certificates for development
# DO NOT USE IN PRODUCTION - Use Let's Encrypt or proper certificates

Write-Host "🔐 Generating self-signed SSL certificates for development..." -ForegroundColor Green

# Create SSL directory
New-Item -ItemType Directory -Force -Path "ssl"

# Generate private key
openssl genrsa -out ssl/bidsquire.com.key 2048

# Generate certificate signing request
openssl req -new -key ssl/bidsquire.com.key -out ssl/bidsquire.com.csr -subj "/C=US/ST=State/L=City/O=Organization/CN=bidsquire.com"

# Generate self-signed certificate
openssl x509 -req -days 365 -in ssl/bidsquire.com.csr -signkey ssl/bidsquire.com.key -out ssl/bidsquire.com.crt

# Set proper permissions (Windows)
icacls ssl/bidsquire.com.key /inheritance:r /grant:r "%USERNAME%:F"

# Clean up CSR file
Remove-Item ssl/bidsquire.com.csr -Force

Write-Host "✅ SSL certificates generated successfully!" -ForegroundColor Green
Write-Host "📁 Files created:" -ForegroundColor Yellow
Write-Host "   - ssl/bidsquire.com.key (private key)" -ForegroundColor White
Write-Host "   - ssl/bidsquire.com.crt (certificate)" -ForegroundColor White
Write-Host ""
Write-Host "⚠️  WARNING: These are self-signed certificates for development only!" -ForegroundColor Red
Write-Host "   For production, use Let's Encrypt or proper SSL certificates." -ForegroundColor Red
