#!/bin/bash

echo "🔧 Setting up production environment file..."

# Check if .env.prod already exists
if [ -f .env.prod ]; then
    echo "⚠️  .env.prod already exists. Do you want to overwrite it? (y/N)"
    read -r response
    if [[ ! "$response" =~ ^[Yy]$ ]]; then
        echo "❌ Setup cancelled."
        exit 1
    fi
fi

# Copy template
cp env.prod.template .env.prod

echo "✅ Created .env.prod from template"
echo ""
echo "🔐 Now you need to edit .env.prod and update these critical values:"
echo ""
echo "1. SECRET_KEY - Generate a new secret key:"
echo "   python -c \"import secrets; print(secrets.token_urlsafe(50))\""
echo ""
echo "2. POSTGRES_PASSWORD - Use a strong password"
echo "3. ADMIN_PASSWORD - Use a secure password"
echo ""
echo "📝 Edit the file:"
echo "   nano .env.prod"
echo ""
echo "🚀 After editing, run the deployment:"
echo "   ./deploy-prod.sh"
