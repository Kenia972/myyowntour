#!/bin/bash

# Myowntour Notification System Setup Script
# This script sets up the complete notification system with Supabase Edge Functions

set -e

echo "🚀 Setting up Myowntour Notification System..."

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

# Check if Supabase CLI is installed
check_supabase_cli() {
    if ! command -v supabase &> /dev/null; then
        print_error "Supabase CLI is not installed!"
        print_status "Installing Supabase CLI..."
        
        # Install Supabase CLI
        if [[ "$OSTYPE" == "darwin"* ]]; then
            # macOS
            brew install supabase/tap/supabase
        elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
            # Linux
            curl -fsSL https://supabase.com/install.sh | sh
        else
            print_error "Unsupported OS. Please install Supabase CLI manually: https://supabase.com/docs/guides/cli"
            exit 1
        fi
    else
        print_success "Supabase CLI is already installed"
    fi
}

# Check if Deno is installed
check_deno() {
    if ! command -v deno &> /dev/null; then
        print_error "Deno is not installed!"
        print_status "Installing Deno..."
        
        # Install Deno
        if [[ "$OSTYPE" == "darwin"* ]]; then
            # macOS
            brew install deno
        elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
            # Linux
            curl -fsSL https://deno.land/install.sh | sh
        else
            print_error "Unsupported OS. Please install Deno manually: https://deno.land/manual/getting_started/installation"
            exit 1
        fi
    else
        print_success "Deno is already installed"
    fi
}

# Setup environment variables
setup_env() {
    print_status "Setting up environment variables..."
    
    if [ ! -f .env.local ]; then
        print_warning "Creating .env.local file..."
        cat > .env.local << EOF
# Supabase Configuration
REACT_APP_SUPABASE_URL=your_supabase_url_here
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# EmailJS Configuration
REACT_APP_EMAILJS_SERVICE_ID=your_emailjs_service_id
REACT_APP_EMAILJS_TEMPLATE_ID=your_emailjs_template_id
REACT_APP_EMAILJS_PUBLIC_KEY=your_emailjs_public_key

# GitHub Secrets (for CI/CD)
# SUPABASE_PROJECT_REF=your_project_ref
# SUPABASE_ACCESS_TOKEN=your_access_token
# SUPABASE_ANON_KEY=your_anon_key
EOF
        print_warning "Please update .env.local with your actual values!"
    else
        print_success ".env.local already exists"
    fi
}

# Deploy database migration
deploy_database() {
    print_status "Deploying database migration..."
    
    if [ ! -f "NOTIFICATION_SYSTEM_MIGRATION.sql" ]; then
        print_error "NOTIFICATION_SYSTEM_MIGRATION.sql not found!"
        exit 1
    fi
    
    # Check if user is logged in to Supabase
    if ! supabase projects list &> /dev/null; then
        print_warning "Please login to Supabase first:"
        supabase login
    fi
    
    print_status "Executing database migration..."
    # Note: You'll need to run this manually in your Supabase dashboard
    print_warning "Please run the following SQL in your Supabase SQL Editor:"
    echo "----------------------------------------"
    cat NOTIFICATION_SYSTEM_MIGRATION.sql
    echo "----------------------------------------"
    
    read -p "Press Enter after running the SQL migration..."
}

# Deploy Edge Function
deploy_edge_function() {
    print_status "Deploying Edge Function..."
    
    if [ ! -d "supabase/functions/send-reminders" ]; then
        print_error "Edge Function not found! Please run this script from the project root."
        exit 1
    fi
    
    # Deploy the function
    supabase functions deploy send-reminders
    
    print_success "Edge Function deployed successfully!"
}

# Setup GitHub Actions
setup_github_actions() {
    print_status "Setting up GitHub Actions..."
    
    if [ ! -d ".github/workflows" ]; then
        mkdir -p .github/workflows
    fi
    
    if [ ! -f ".github/workflows/send-reminders.yml" ]; then
        print_error "GitHub Actions workflow not found!"
        exit 1
    fi
    
    print_success "GitHub Actions workflow is ready!"
    print_warning "Please add the following secrets to your GitHub repository:"
    echo "  - SUPABASE_PROJECT_REF"
    echo "  - SUPABASE_ACCESS_TOKEN"
    echo "  - SUPABASE_ANON_KEY"
}

# Test the system
test_system() {
    print_status "Testing the notification system..."
    
    # Test Edge Function
    print_status "Testing Edge Function..."
    response=$(curl -X POST \
        -H "Authorization: Bearer $REACT_APP_SUPABASE_ANON_KEY" \
        -H "Content-Type: application/json" \
        -H "apikey: $REACT_APP_SUPABASE_ANON_KEY" \
        https://$(echo $REACT_APP_SUPABASE_URL | sed 's/.*\/\/\([^.]*\).*/\1/').supabase.co/functions/v1/send-reminders 2>/dev/null)
    
    if [ $? -eq 0 ]; then
        print_success "Edge Function test successful!"
        echo "Response: $response"
    else
        print_warning "Edge Function test failed. Make sure your environment variables are set correctly."
    fi
}

# Main setup process
main() {
    echo "🌴 Myowntour Notification System Setup"
    echo "======================================"
    
    # Check prerequisites
    check_supabase_cli
    check_deno
    
    # Setup environment
    setup_env
    
    # Deploy database
    deploy_database
    
    # Deploy Edge Function
    deploy_edge_function
    
    # Setup GitHub Actions
    setup_github_actions
    
    # Test system
    test_system
    
    echo ""
    print_success "🎉 Notification system setup complete!"
    echo ""
    echo "Next steps:"
    echo "1. Update your .env.local with actual values"
    echo "2. Add GitHub secrets for CI/CD"
    echo "3. Configure EmailJS templates"
    echo "4. Test the system with real data"
    echo ""
    echo "For detailed instructions, see: NOTIFICATION_CRON_SETUP.md"
}

# Run main function
main "$@"
