#!/bin/bash

# Ubuntu Quick Start Script for Auction Workflow
# This script automates the initial setup for production deployment

set -e

echo "🚀 Ubuntu Quick Start for Auction Workflow Production"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   echo "❌ This script should not be run as root. Please run as a regular user with sudo privileges."
   exit 1
fi

print_status "Checking system requirements..."

# Check Ubuntu version
if ! command -v lsb_release &> /dev/null || ! lsb_release -d | grep -q "Ubuntu"; then
    echo "❌ This script is designed for Ubuntu. Please run on Ubuntu 20.04 LTS or later."
    exit 1
fi

print_success "Ubuntu detected: $(lsb_release -d | cut -f2)"

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    print_status "Docker not found. Installing Docker..."
    
    # Update package index
    sudo apt update
    
    # Install prerequisites
    sudo apt install -y apt-transport-https ca-certificates curl software-properties-common
    
    # Add Docker's official GPG key
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
    
    # Add Docker repository
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
    
    # Install Docker
    sudo apt update
    sudo apt install -y docker-ce docker-ce-cli containerd.io
    
    # Add user to docker group
    sudo usermod -aG docker $USER
    
    print_success "Docker installed successfully!"
    print_warning "Please logout and login again for Docker group changes to take effect."
    print_warning "Then run this script again to continue."
    exit 0
else
    print_success "Docker is already installed"
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    print_status "Docker Compose not found. Installing Docker Compose..."
    
    # Install Docker Compose
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    
    print_success "Docker Compose installed successfully!"
else
    print_success "Docker Compose is already installed"
fi

# Check if user is in docker group
if ! groups $USER | grep -q docker; then
    print_warning "User not in docker group. Adding user to docker group..."
    sudo usermod -aG docker $USER
    print_warning "Please logout and login again for Docker group changes to take effect."
    print_warning "Then run this script again to continue."
    exit 0
fi

print_status "Setting up project directories..."

# Create necessary directories
mkdir -p nginx/logs nginx/ssl postgres-init

# Check if .env.prod exists
if [ ! -f .env.prod ]; then
    print_status "Creating production environment file..."
    if [ -f env.prod.template ]; then
        cp env.prod.template .env.prod
        print_success "Created .env.prod from template"
        print_warning "Please edit .env.prod with your production values before deploying!"
    else
        print_warning "env.prod.template not found. Please create .env.prod manually."
    fi
else
    print_success ".env.prod already exists"
fi

# Make deployment script executable
chmod +x deploy-prod.sh

print_success "Quick start setup completed!"
echo ""
echo "📋 Next Steps:"
echo "1. Edit .env.prod with your production values"
echo "2. Run: ./deploy-prod.sh"
echo ""
echo "📚 For detailed instructions, see: UBUNTU_PRODUCTION_DEPLOYMENT.md"
echo ""
print_warning "Remember to update passwords and secrets in .env.prod before deploying!"
