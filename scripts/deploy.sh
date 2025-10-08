#!/bin/bash

# SchoolPortal Deployment Script
echo "🚀 Starting SchoolPortal Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if required tools are installed
check_requirements() {
    print_status "Checking requirements..."
    
    if ! command -v git &> /dev/null; then
        print_error "Git is not installed. Please install Git first."
        exit 1
    fi
    
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js first."
        exit 1
    fi
    
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed. Please install npm first."
        exit 1
    fi
    
    print_success "All requirements are met!"
}

# Install dependencies
install_dependencies() {
    print_status "Installing dependencies..."
    npm install
    if [ $? -eq 0 ]; then
        print_success "Dependencies installed successfully!"
    else
        print_error "Failed to install dependencies!"
        exit 1
    fi
}

# Generate Prisma client
generate_prisma() {
    print_status "Generating Prisma client..."
    npx prisma generate
    if [ $? -eq 0 ]; then
        print_success "Prisma client generated successfully!"
    else
        print_error "Failed to generate Prisma client!"
        exit 1
    fi
}

# Build the application
build_app() {
    print_status "Building application..."
    npm run build
    if [ $? -eq 0 ]; then
        print_success "Application built successfully!"
    else
        print_error "Failed to build application!"
        exit 1
    fi
}

# Run tests (if available)
run_tests() {
    if [ -f "package.json" ] && grep -q '"test"' package.json; then
        print_status "Running tests..."
        npm test
        if [ $? -eq 0 ]; then
            print_success "All tests passed!"
        else
            print_warning "Some tests failed, but continuing deployment..."
        fi
    else
        print_warning "No tests found, skipping test step."
    fi
}

# Check environment variables
check_env() {
    print_status "Checking environment variables..."
    
    if [ -z "$DATABASE_URL" ]; then
        print_warning "DATABASE_URL is not set. Please set it before deployment."
    fi
    
    if [ -z "$NEXTAUTH_SECRET" ]; then
        print_warning "NEXTAUTH_SECRET is not set. Please set it before deployment."
    fi
    
    if [ -z "$NEXTAUTH_URL" ]; then
        print_warning "NEXTAUTH_URL is not set. Please set it before deployment."
    fi
}

# Main deployment function
deploy() {
    print_status "Starting deployment process..."
    
    check_requirements
    install_dependencies
    generate_prisma
    run_tests
    build_app
    check_env
    
    print_success "Deployment preparation completed!"
    print_status "Next steps:"
    echo "1. Push your code to GitHub"
    echo "2. Connect your repository to Vercel"
    echo "3. Set up environment variables in Vercel"
    echo "4. Deploy!"
}

# Run deployment
deploy
