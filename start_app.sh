#!/bin/bash

# Presidio Solution Proposal Generator - Application Startup Script
# This script kills any existing processes and starts both frontend and backend services

set -e  # Exit on any error

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

# Function to kill processes on specific ports
kill_port_processes() {
    local port=$1
    local service_name=$2
    
    print_status "Checking for existing processes on port $port ($service_name)..."
    
    # Find and kill processes on the specified port
    local pids=$(lsof -ti:$port 2>/dev/null || true)
    
    if [ -n "$pids" ]; then
        print_warning "Found existing processes on port $port: $pids"
        echo "$pids" | xargs kill -9 2>/dev/null || true
        sleep 2
        
        # Double-check if processes are gone
        local remaining_pids=$(lsof -ti:$port 2>/dev/null || true)
        if [ -n "$remaining_pids" ]; then
            print_error "Failed to kill some processes on port $port: $remaining_pids"
            print_error "Please manually kill these processes and try again"
            exit 1
        else
            print_success "Successfully killed processes on port $port"
        fi
    else
        print_status "No existing processes found on port $port"
    fi
}

# Function to check AWS configuration
check_aws_configuration() {
    print_status "Checking AWS configuration..."
    
    local aws_configured=false
    local config_method=""
    
    # Check for environment variables
    if [ -n "$AWS_ACCESS_KEY_ID" ] && [ -n "$AWS_SECRET_ACCESS_KEY" ]; then
        aws_configured=true
        config_method="environment variables"
        print_success "AWS credentials found in environment variables"
    
    # Check for AWS CLI configuration
    elif command -v aws >/dev/null 2>&1; then
        if aws sts get-caller-identity >/dev/null 2>&1; then
            aws_configured=true
            config_method="AWS CLI configuration"
            print_success "AWS credentials found via AWS CLI configuration"
        fi
    fi
    
    # Check for .env file in backend
    if [ -f "$BACKEND_DIR/.env" ]; then
        if grep -q "AWS_ACCESS_KEY_ID" "$BACKEND_DIR/.env" && grep -q "AWS_SECRET_ACCESS_KEY" "$BACKEND_DIR/.env"; then
            aws_configured=true
            config_method="backend .env file"
            print_success "AWS credentials found in backend .env file"
        fi
    fi
    
    if [ "$aws_configured" = false ]; then
        print_error "🚫 AWS configuration not found!"
        print_error "";
        print_error "The Presidio Solution Proposal Generator requires AWS Bedrock access."
        print_error "You need to configure AWS credentials using one of these methods:"
        print_error ""
        print_error "Option 1: AWS CLI (Recommended for development)"
        print_error "  aws configure"
        print_error "  # Enter your AWS Access Key ID, Secret Key, and region (us-east-1)"
        print_error ""
        print_error "Option 2: Environment Variables"
        print_error "  export AWS_ACCESS_KEY_ID=your_access_key_id"
        print_error "  export AWS_SECRET_ACCESS_KEY=your_secret_access_key"
        print_error "  export AWS_REGION=us-east-1"
        print_error ""
        print_error "Option 3: Backend .env File"
        print_error "  Create $BACKEND_DIR/.env with:"
        print_error "  AWS_ACCESS_KEY_ID=your_access_key_id"
        print_error "  AWS_SECRET_ACCESS_KEY=your_secret_access_key"
        print_error "  AWS_REGION=us-east-1"
        print_error "  NODE_ENV=development"
        print_error "  PORT=3001"
        print_error "  FRONTEND_URL=http://localhost:3000"
        print_error ""
        print_error "📖 For more details, see: backend/AWS_BEDROCK_MIGRATION.md"
        print_error ""
        
        read -p "$(echo -e "${YELLOW}Do you want to configure AWS now? (y/n): ${NC}")" configure_aws
        
        if [[ $configure_aws =~ ^[Yy]$ ]]; then
            configure_aws_interactively
        else
            print_error "Cannot start application without AWS configuration. Exiting."
            exit 1
        fi
    else
        print_success "AWS configured via: $config_method"
    fi
    
    # Check AWS region
    local aws_region="$AWS_REGION"
    if [ -z "$aws_region" ] && [ -f "$BACKEND_DIR/.env" ]; then
        aws_region=$(grep "^AWS_REGION=" "$BACKEND_DIR/.env" 2>/dev/null | cut -d'=' -f2)
    fi
    if [ -z "$aws_region" ] && command -v aws >/dev/null 2>&1; then
        aws_region=$(aws configure get region 2>/dev/null)
    fi
    
    if [ -z "$aws_region" ]; then
        print_warning "AWS region not specified, will use default: us-east-1"
    else
        print_success "AWS region: $aws_region"
    fi
}

# Function to configure AWS interactively
configure_aws_interactively() {
    print_status "Interactive AWS Configuration"
    print_status "=============================="
    
    if command -v aws >/dev/null 2>&1; then
        print_status "AWS CLI detected. Would you like to use 'aws configure'?"
        read -p "$(echo -e "${BLUE}Use AWS CLI configure? (y/n): ${NC}")" use_aws_cli
        
        if [[ $use_aws_cli =~ ^[Yy]$ ]]; then
            print_status "Running 'aws configure'..."
            print_status "Please enter your AWS credentials when prompted."
            print_status "Recommended region: us-east-1"
            print_status "Recommended output format: json"
            aws configure
            
            # Test the configuration
            if aws sts get-caller-identity >/dev/null 2>&1; then
                print_success "AWS configuration successful!"
                return 0
            else
                print_error "AWS configuration test failed. Please check your credentials."
            fi
        fi
    fi
    
    # Fallback to .env file creation
    print_status "Creating backend/.env file..."
    
    read -p "$(echo -e "${BLUE}Enter your AWS Access Key ID: ${NC}")" aws_access_key
    read -s -p "$(echo -e "${BLUE}Enter your AWS Secret Access Key: ${NC}")" aws_secret_key
    echo  # New line after hidden input
    read -p "$(echo -e "${BLUE}Enter AWS Region (default: us-east-1): ${NC}")" aws_region
    
    # Use default region if not specified
    if [ -z "$aws_region" ]; then
        aws_region="us-east-1"
    fi
    
    # Create .env file
    cat > "$BACKEND_DIR/.env" << EOF
# AWS Configuration
AWS_ACCESS_KEY_ID=$aws_access_key
AWS_SECRET_ACCESS_KEY=$aws_secret_key
AWS_REGION=$aws_region

# Server Configuration
NODE_ENV=development
PORT=3001
FRONTEND_URL=http://localhost:3000
EOF
    
    print_success "Created backend/.env file with AWS configuration"
    print_warning "Note: Never commit .env files to version control!"
    
    # Add .env to .gitignore if it exists
    if [ -f "$SCRIPT_DIR/.gitignore" ]; then
        if ! grep -q "\.env" "$SCRIPT_DIR/.gitignore"; then
            echo "*.env" >> "$SCRIPT_DIR/.gitignore"
            print_status "Added *.env to .gitignore"
        fi
    fi
}

# Function to test AWS Bedrock connectivity (optional)
test_bedrock_connectivity() {
    print_status "Testing AWS Bedrock connectivity..."
    
    if command -v aws >/dev/null 2>&1; then
        # Test basic AWS connectivity
        if ! aws sts get-caller-identity >/dev/null 2>&1; then
            print_warning "AWS STS call failed - credentials may be invalid"
            return 1
        fi
        
        # Test Bedrock model listing (optional - requires permissions)
        local aws_region="$AWS_REGION"
        if [ -z "$aws_region" ] && [ -f "$BACKEND_DIR/.env" ]; then
            aws_region=$(grep "^AWS_REGION=" "$BACKEND_DIR/.env" 2>/dev/null | cut -d'=' -f2)
        fi
        if [ -z "$aws_region" ]; then
            aws_region="us-east-1"
        fi
        
        if aws bedrock list-foundation-models --region "$aws_region" >/dev/null 2>&1; then
            print_success "AWS Bedrock connectivity confirmed"
            local claude_models=$(aws bedrock list-foundation-models --region "$aws_region" --by-provider anthropic 2>/dev/null | grep -c "claude" || echo "0")
            if [ "$claude_models" -gt 0 ]; then
                print_success "Found $claude_models Claude models available in $aws_region"
            else
                print_warning "No Claude models found - you may need to request access in AWS Console"
            fi
        else
            print_warning "Could not verify Bedrock access (this is normal for first-time setup)"
            print_status "The backend will test model availability during startup"
        fi
    else
        print_warning "AWS CLI not installed - skipping Bedrock connectivity test"
        print_status "Install AWS CLI with: brew install awscli (recommended for development)"
    fi
}

# Function to check if dependencies are installed
check_dependencies() {
    local dir=$1
    local service_name=$2
    
    if [ ! -d "$dir/node_modules" ] || [ "$dir/package.json" -nt "$dir/node_modules" ]; then
        print_warning "$service_name dependencies not found or outdated. Installing..."
        cd "$dir"
        npm install
        cd - > /dev/null
        print_success "$service_name dependencies installed"
    else
        print_status "$service_name dependencies are up to date"
    fi
}

# Function to wait for service to be ready
wait_for_service() {
    local port=$1
    local service_name=$2
    local max_attempts=30
    local attempt=1
    
    print_status "Waiting for $service_name to start on port $port..."
    
    while [ $attempt -le $max_attempts ]; do
        if curl -s "http://localhost:$port" > /dev/null 2>&1 || nc -z localhost $port 2>/dev/null; then
            print_success "$service_name is ready on port $port"
            return 0
        fi
        
        printf "."
        sleep 2
        attempt=$((attempt + 1))
    done
    
    print_error "$service_name failed to start within expected time"
    return 1
}

# Main execution starts here
print_status "Starting Presidio Solution Proposal Generator..."
print_status "=========================================="

# Get the directory where the script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$SCRIPT_DIR/backend"
FRONTEND_DIR="$SCRIPT_DIR/frontend"

# Verify directories exist
if [ ! -d "$BACKEND_DIR" ]; then
    print_error "Backend directory not found: $BACKEND_DIR"
    exit 1
fi

if [ ! -d "$FRONTEND_DIR" ]; then
    print_error "Frontend directory not found: $FRONTEND_DIR"
    exit 1
fi

# Kill existing processes
kill_port_processes 3001 "Backend"
kill_port_processes 3000 "Frontend"

# Check AWS configuration (critical for backend)
check_aws_configuration

# Check and install dependencies
check_dependencies "$BACKEND_DIR" "Backend"
check_dependencies "$FRONTEND_DIR" "Frontend"

# Create log directory
LOG_DIR="$SCRIPT_DIR/logs"
mkdir -p "$LOG_DIR"

print_status "Starting services..."

# Start backend service
print_status "Starting backend service on port 3001..."
cd "$BACKEND_DIR"
nohup npm run dev > "$LOG_DIR/backend.log" 2>&1 &
BACKEND_PID=$!
cd - > /dev/null

# Give backend a moment to start
sleep 3

# Check if backend process is still running
if ! kill -0 $BACKEND_PID 2>/dev/null; then
    print_error "Backend failed to start. Check logs:"
    tail -n 20 "$LOG_DIR/backend.log"
    exit 1
fi

# Start frontend service
print_status "Starting frontend service on port 3000..."
cd "$FRONTEND_DIR"
nohup npm start > "$LOG_DIR/frontend.log" 2>&1 &
FRONTEND_PID=$!
cd - > /dev/null

# Store PIDs for reference
echo $BACKEND_PID > "$LOG_DIR/backend.pid"
echo $FRONTEND_PID > "$LOG_DIR/frontend.pid"

# Wait for services to be ready
wait_for_service 3001 "Backend" &
BACKEND_WAIT_PID=$!

wait_for_service 3000 "Frontend" &
FRONTEND_WAIT_PID=$!

# Wait for both services to be ready
wait $BACKEND_WAIT_PID
BACKEND_READY=$?

wait $FRONTEND_WAIT_PID
FRONTEND_READY=$?

# Check if both services started successfully
if [ $BACKEND_READY -eq 0 ] && [ $FRONTEND_READY -eq 0 ]; then
    print_success "=========================================="
    print_success "🚀 Application started successfully!"
    print_success "=========================================="
    print_success "Frontend: http://localhost:3000"
    print_success "Backend:  http://localhost:3001"
    print_success "=========================================="
    print_status "Process IDs:"
    print_status "  Backend PID:  $BACKEND_PID"
    print_status "  Frontend PID: $FRONTEND_PID"
    print_status ""
    print_status "Logs are available in:"
    print_status "  Backend:  $LOG_DIR/backend.log"
    print_status "  Frontend: $LOG_DIR/frontend.log"
    print_status ""
    print_status "To stop the application, run: ./stop_app.sh"
    print_status "Or manually kill processes: kill $BACKEND_PID $FRONTEND_PID"
else
    print_error "Failed to start one or more services"
    print_status "Cleaning up..."
    
    # Kill the processes if they're running
    kill $BACKEND_PID 2>/dev/null || true
    kill $FRONTEND_PID 2>/dev/null || true
    
    print_status "Check the logs for more details:"
    print_status "  Backend:  $LOG_DIR/backend.log"
    print_status "  Frontend: $LOG_DIR/frontend.log"
    exit 1
fi