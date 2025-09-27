#!/bin/bash

# Quick Setup Script for VN OP.GG Discord Bot
# Usage: chmod +x setup.sh && ./setup.sh

set -e  # Exit on any error

echo "🚀 VN OP.GG Discord Bot - Quick Setup"
echo "====================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
print_step() {
    echo -e "${BLUE}📋 $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if Node.js is installed
check_nodejs() {
    print_step "Checking Node.js installation..."
    
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node -v)
        NODE_MAJOR_VERSION=$(echo $NODE_VERSION | cut -d'.' -f1 | sed 's/v//')
        
        if [ "$NODE_MAJOR_VERSION" -ge 16 ]; then
            print_success "Node.js $NODE_VERSION found (✅ Compatible)"
        else
            print_error "Node.js $NODE_VERSION found (❌ Need v16+)"
            echo "Please install Node.js 16+ from https://nodejs.org/"
            exit 1
        fi
    else
        print_error "Node.js not found"
        echo "Please install Node.js 16+ from https://nodejs.org/"
        exit 1
    fi
}

# Check if npm is installed
check_npm() {
    print_step "Checking npm installation..."
    
    if command -v npm &> /dev/null; then
        NPM_VERSION=$(npm -v)
        print_success "npm $NPM_VERSION found"
    else
        print_error "npm not found"
        echo "Please install npm"
        exit 1
    fi
}

# Install dependencies
install_dependencies() {
    print_step "Installing dependencies..."
    
    if [ -f "package.json" ]; then
        npm install
        print_success "Dependencies installed"
    else
        print_error "package.json not found"
        echo "Please run this script from the project root directory"
        exit 1
    fi
}

# Setup environment file
setup_environment() {
    print_step "Setting up environment file..."
    
    if [ ! -f ".env" ]; then
        if [ -f ".env.example" ]; then
            cp .env.example .env
            print_success "Created .env from template"
            print_warning "Please edit .env with your Discord bot credentials"
        else
            print_error ".env.example not found"
            exit 1
        fi
    else
        print_warning ".env already exists, skipping..."
    fi
}

# Check Chrome dependencies (Linux only)
check_chrome_deps() {
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        print_step "Checking Chrome dependencies (Linux)..."
        
        # List of required packages for Puppeteer/Chrome
        REQUIRED_PACKAGES=(
            "libnss3"
            "libatk-bridge2.0-0"
            "libgtk-3-0"
            "libx11-xcb1"
            "libxcomposite1"
            "libxcursor1"
            "libxdamage1"
            "libxi6"
            "libxtst6"
            "libxrandr2"
            "libasound2"
            "libpangocairo-1.0-0"
            "libatk1.0-0"
            "libcups2"
            "libdrm2"
            "libxss1"
            "libgconf-2-4"
        )
        
        MISSING_PACKAGES=()
        
        for package in "${REQUIRED_PACKAGES[@]}"; do
            if ! dpkg -l | grep -q "^ii  $package "; then
                MISSING_PACKAGES+=("$package")
            fi
        done
        
        if [ ${#MISSING_PACKAGES[@]} -eq 0 ]; then
            print_success "All Chrome dependencies found"
        else
            print_warning "Missing Chrome dependencies detected"
            echo "Missing packages: ${MISSING_PACKAGES[*]}"
            echo ""
            echo "To install missing dependencies, run:"
            echo "sudo apt-get update"
            echo "sudo apt-get install -y ${MISSING_PACKAGES[*]}"
            echo ""
            read -p "Would you like to install them now? (y/N): " -n 1 -r
            echo
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                sudo apt-get update
                sudo apt-get install -y "${MISSING_PACKAGES[@]}"
                print_success "Chrome dependencies installed"
            else
                print_warning "Skipped Chrome dependencies installation"
                print_warning "You may need to install them later for Puppeteer to work"
            fi
        fi
    fi
}

# Test Chrome/Puppeteer
test_puppeteer() {
    print_step "Testing Puppeteer/Chrome..."
    
    node -e "
        const puppeteer = require('puppeteer');
        (async () => {
            try {
                const browser = await puppeteer.launch({ headless: 'new' });
                await browser.close();
                console.log('✅ Puppeteer/Chrome test successful');
            } catch (error) {
                console.log('❌ Puppeteer/Chrome test failed:', error.message);
                process.exit(1);
            }
        })();
    " || {
        print_error "Puppeteer/Chrome test failed"
        print_warning "You may need to install Chrome dependencies"
        if [[ "$OSTYPE" == "linux-gnu"* ]]; then
            echo "Run: sudo apt-get install -y gconf-service libasound2 libatk1.0-0 libc6 libcairo2 libcups2 libdbus-1-3 libexpat1 libfontconfig1 libgcc1 libgconf-2-4 libgdk-pixbuf2.0-0 libglib2.0-0 libgtk-3-0 libnspr4 libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 libxtst6 ca-certificates fonts-liberation libappindicator1 libnss3 lsb-release xdg-utils wget"
        fi
    }
}

# Create necessary directories
create_directories() {
    print_step "Creating necessary directories..."
    
    mkdir -p logs
    mkdir -p screenshots
    mkdir -p test
    
    print_success "Directories created"
}

# Show next steps
show_next_steps() {
    echo ""
    echo "🎉 Setup completed successfully!"
    echo "================================"
    echo ""
    echo "📝 Next steps:"
    echo ""
    echo "1. Configure Discord Bot:"
    echo "   - Go to https://discord.com/developers/applications"
    echo "   - Create a new application"
    echo "   - Get bot token and client ID"
    echo "   - Edit .env file with your credentials"
    echo ""
    echo "2. Test the setup:"
    echo "   npm test"
    echo ""
    echo "3. Test with real data:"
    echo "   node manual-test.js \"Richard Mille\" \"666\""
    echo ""
    echo "4. Start development:"
    echo "   npm run dev"
    echo ""
    echo "5. Deploy bot commands:"
    echo "   npm run deploy:register"
    echo ""
    echo "📚 For detailed instructions, see README.md"
    echo ""
    print_warning "Don't forget to edit .env with your Discord bot credentials!"
}

# Main execution
main() {
    echo ""
    
    # Pre-flight checks
    check_nodejs
    check_npm
    
    # Setup process
    install_dependencies
    setup_environment
    create_directories
    check_chrome_deps
    test_puppeteer
    
    # Complete
    show_next_steps
}

# Handle interruption
trap 'echo -e "\n🛑 Setup interrupted by user"; exit 1' SIGINT

# Run main function
main

# Make the script executable if it's not already
chmod +x "$0"

echo "✨ Setup script completed!"