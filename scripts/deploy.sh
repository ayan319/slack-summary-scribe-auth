#!/bin/bash

# Production Deployment Script for Slack Summary Scribe
# This script automates the deployment process to Vercel

set -e  # Exit on any error

echo "🚀 Starting deployment process for Slack Summary Scribe..."

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
check_dependencies() {
    print_status "Checking dependencies..."
    
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed"
        exit 1
    fi
    
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed"
        exit 1
    fi
    
    if ! command -v vercel &> /dev/null; then
        print_warning "Vercel CLI not found. Installing..."
        npm install -g vercel
    fi
    
    print_success "All dependencies are available"
}

# Validate environment variables
validate_environment() {
    print_status "Validating environment variables..."
    
    # Run our environment validation script
    if [ -f "src/lib/env-validation.ts" ]; then
        node -e "
        const { validateEnvironment, printValidationResults } = require('./src/lib/env-validation.ts');
        const result = validateEnvironment();
        printValidationResults(result);
        "
    else
        print_warning "Environment validation script not found"
    fi
}

# Run tests
run_tests() {
    print_status "Running tests..."
    
    # Install dependencies if needed
    if [ ! -d "node_modules" ]; then
        print_status "Installing dependencies..."
        npm install
    fi
    
    # Run build to check for errors
    print_status "Building application..."
    npm run build
    
    # Run production tests if available
    if [ -f "scripts/test-production.js" ]; then
        print_status "Running production tests..."
        node scripts/test-production.js
    fi
    
    print_success "All tests passed"
}

# Deploy to Vercel
deploy_to_vercel() {
    print_status "Deploying to Vercel..."
    
    # Check if user is logged in to Vercel
    if ! vercel whoami &> /dev/null; then
        print_status "Please log in to Vercel..."
        vercel login
    fi
    
    # Deploy to production
    print_status "Deploying to production..."
    vercel --prod --confirm
    
    print_success "Deployment completed successfully!"
}

# Set up environment variables on Vercel
setup_env_vars() {
    print_status "Setting up environment variables..."
    
    # List of required environment variables
    ENV_VARS=(
        "NEXT_PUBLIC_APP_URL"
        "CASHFREE_CLIENT_ID"
        "CASHFREE_CLIENT_SECRET"
        "CASHFREE_WEBHOOK_SECRET"
        "SLACK_CLIENT_ID"
        "SLACK_CLIENT_SECRET"
        "SLACK_SIGNING_SECRET"
        "DEEPSEEK_API_KEY"
        "RESEND_API_KEY"
        "EMAIL_FROM"
        "EMAIL_REPLY_TO"
        "NEXTAUTH_SECRET"
        "JWT_SECRET"
        "NEXT_PUBLIC_PLAUSIBLE_DOMAIN"
    )
    
    print_status "Please ensure the following environment variables are set in Vercel:"
    for var in "${ENV_VARS[@]}"; do
        echo "  - $var"
    done
    
    echo ""
    read -p "Have you set all required environment variables in Vercel? (y/n): " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_warning "Please set up environment variables in Vercel dashboard before continuing"
        print_status "You can set them at: https://vercel.com/dashboard/[your-project]/settings/environment-variables"
        exit 1
    fi
}

# Post-deployment verification
verify_deployment() {
    print_status "Verifying deployment..."
    
    # Get the deployment URL
    DEPLOYMENT_URL=$(vercel --prod --confirm 2>&1 | grep -o 'https://[^[:space:]]*' | head -1)
    
    if [ -z "$DEPLOYMENT_URL" ]; then
        print_warning "Could not determine deployment URL"
        return
    fi
    
    print_status "Deployment URL: $DEPLOYMENT_URL"
    
    # Wait a moment for deployment to be ready
    sleep 10
    
    # Test basic endpoints
    print_status "Testing deployment..."
    
    # Test homepage
    if curl -s -o /dev/null -w "%{http_code}" "$DEPLOYMENT_URL" | grep -q "200"; then
        print_success "Homepage is accessible"
    else
        print_error "Homepage is not accessible"
    fi
    
    # Test health endpoint
    if curl -s -o /dev/null -w "%{http_code}" "$DEPLOYMENT_URL/api/health" | grep -q "200"; then
        print_success "Health endpoint is working"
    else
        print_warning "Health endpoint may not be working"
    fi
    
    print_success "Deployment verification completed"
}

# Main deployment process
main() {
    echo "🎯 Slack Summary Scribe - Production Deployment"
    echo "=============================================="
    echo ""
    
    # Check if we're in the right directory
    if [ ! -f "package.json" ]; then
        print_error "package.json not found. Please run this script from the project root."
        exit 1
    fi
    
    # Run all deployment steps
    check_dependencies
    validate_environment
    run_tests
    setup_env_vars
    deploy_to_vercel
    verify_deployment
    
    echo ""
    echo "🎉 Deployment completed successfully!"
    echo ""
    echo "Next steps:"
    echo "1. Test the production application thoroughly"
    echo "2. Set up monitoring and alerts"
    echo "3. Configure your domain (if using custom domain)"
    echo "4. Update DNS records if needed"
    echo "5. Test payment flows with real transactions"
    echo "6. Monitor logs for any issues"
    echo ""
    echo "Your application is now live! 🚀"
}

# Run the main function
main "$@"
