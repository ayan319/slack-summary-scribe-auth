#!/bin/bash

# Slack Summary Scribe - Deployment Script
# This script helps deploy the application to various platforms

set -e

echo "🚀 Slack Summary Scribe Deployment Script"
echo "=========================================="

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the project root."
    exit 1
fi

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to deploy to Vercel
deploy_vercel() {
    echo "📦 Deploying to Vercel..."
    
    if ! command_exists vercel; then
        echo "❌ Vercel CLI not found. Installing..."
        npm install -g vercel
    fi
    
    echo "🔧 Building the application..."
    npm run build
    
    echo "🚀 Deploying to Vercel..."
    vercel --prod
    
    echo "✅ Deployment to Vercel completed!"
    echo "📝 Don't forget to set your environment variables in the Vercel dashboard:"
    echo "   - NEXTAUTH_URL"
    echo "   - NEXTAUTH_SECRET"
    echo "   - SUPABASE_URL"
    echo "   - SUPABASE_ANON_KEY"
    echo "   - SUPABASE_SERVICE_ROLE_KEY"
    echo "   - DEEPSEEK_API_KEY"
    echo "   - NOTION_TOKEN"
    echo "   - SLACK_BOT_TOKEN"
    echo "   - SLACK_SIGNING_SECRET"
    echo "   - SLACK_CLIENT_ID"
    echo "   - SLACK_CLIENT_SECRET"
    echo "   - SALESFORCE_TOKEN"
    echo "   - HUBSPOT_TOKEN"
    echo "   - PIPEDRIVE_TOKEN"
    echo "   - CUSTOM_TOKEN"
}

# Function to deploy to Netlify
deploy_netlify() {
    echo "📦 Deploying to Netlify..."
    
    if ! command_exists netlify; then
        echo "❌ Netlify CLI not found. Installing..."
        npm install -g netlify-cli
    fi
    
    echo "🔧 Building the application..."
    npm run build
    
    echo "🚀 Deploying to Netlify..."
    netlify deploy --prod --dir=.next
    
    echo "✅ Deployment to Netlify completed!"
}

# Function to build Docker image
build_docker() {
    echo "🐳 Building Docker image..."
    
    if ! command_exists docker; then
        echo "❌ Docker not found. Please install Docker first."
        exit 1
    fi
    
    echo "🔧 Building Docker image..."
    docker build -t slack-summary-scribe .
    
    echo "✅ Docker image built successfully!"
    echo "🚀 To run the container:"
    echo "   docker run -p 3000:3000 --env-file .env slack-summary-scribe"
}

# Function to check environment variables
check_env() {
    echo "🔍 Checking environment variables..."
    
    required_vars=(
        "SUPABASE_URL"
        "SUPABASE_ANON_KEY"
        "NEXTAUTH_SECRET"
    )
    
    missing_vars=()
    
    for var in "${required_vars[@]}"; do
        if [ -z "${!var}" ]; then
            missing_vars+=("$var")
        fi
    done
    
    if [ ${#missing_vars[@]} -eq 0 ]; then
        echo "✅ All required environment variables are set!"
    else
        echo "⚠️  Missing required environment variables:"
        for var in "${missing_vars[@]}"; do
            echo "   - $var"
        done
        echo ""
        echo "📝 Please set these variables in your .env file or environment."
    fi
}

# Function to run tests before deployment
run_tests() {
    echo "🧪 Running tests..."
    npm test
    echo "✅ All tests passed!"
}

# Function to show help
show_help() {
    echo "Usage: $0 [OPTION]"
    echo ""
    echo "Options:"
    echo "  vercel     Deploy to Vercel"
    echo "  netlify    Deploy to Netlify"
    echo "  docker     Build Docker image"
    echo "  check      Check environment variables"
    echo "  test       Run tests"
    echo "  help       Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 vercel    # Deploy to Vercel"
    echo "  $0 check     # Check environment setup"
    echo "  $0 test      # Run tests before deployment"
}

# Main script logic
case "${1:-help}" in
    vercel)
        check_env
        run_tests
        deploy_vercel
        ;;
    netlify)
        check_env
        run_tests
        deploy_netlify
        ;;
    docker)
        check_env
        run_tests
        build_docker
        ;;
    check)
        check_env
        ;;
    test)
        run_tests
        ;;
    help|*)
        show_help
        ;;
esac

echo ""
echo "🎉 Script completed!"
