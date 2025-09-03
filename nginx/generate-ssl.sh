#!/bin/bash

# Generate self-signed SSL certificates for development
# DO NOT USE IN PRODUCTION - Use Let's Encrypt or proper certificates

echo "🔐 Generating self-signed SSL certificates for development..."

# Create SSL directory
mkdir -p ssl

# Generate private key
openssl genrsa -out ssl/bidsquire.com.key 2048

# Generate certificate signing request
openssl req -new -key ssl/bidsquire.com.key -out ssl/bidsquire.com.csr -subj "/C=US/ST=State/L=City/O=Organization/CN=bidsquire.com"

# Generate self-signed certificate
openssl x509 -req -days 365 -in ssl/bidsquire.com.csr -signkey ssl/bidsquire.com.key -out ssl/bidsquire.com.crt

# Set proper permissions
chmod 600 ssl/bidsquire.com.key
chmod 644 ssl/bidsquire.com.crt

# Clean up CSR file
rm ssl/bidsquire.com.csr

echo "✅ SSL certificates generated successfully!"
echo "📁 Files created:"
echo "   - ssl/bidsquire.com.key (private key)"
echo "   - ssl/bidsquire.com.crt (certificate)"
echo ""
echo "⚠️  WARNING: These are self-signed certificates for development only!"
echo "   For production, use Let's Encrypt or proper SSL certificates."
