#!/bin/bash

# Presidio Solution Proposal Generator - Application Stop Script
# This script cleanly stops both frontend and backend services

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
    
    print_status "Stopping $service_name (port $port)..."
    
    # Find and kill processes on the specified port
    local pids=$(lsof -ti:$port 2>/dev/null || true)
    
    if [ -n "$pids" ]; then
        print_status "Found processes on port $port: $pids"
        
        # Try graceful shutdown first (SIGTERM)
        echo "$pids" | xargs kill -TERM 2>/dev/null || true
        sleep 3
        
        # Check if processes are still running
        local remaining_pids=$(lsof -ti:$port 2>/dev/null || true)
        
        if [ -n "$remaining_pids" ]; then
            print_warning "Processes still running, forcing shutdown..."
            echo "$remaining_pids" | xargs kill -9 2>/dev/null || true
            sleep 1
            
            # Final check
            local final_pids=$(lsof -ti:$port 2>/dev/null || true)
            if [ -n "$final_pids" ]; then
                print_error "Failed to kill processes on port $port: $final_pids"
                return 1
            fi
        fi
        
        print_success "$service_name stopped successfully"
    else
        print_status "No $service_name processes found on port $port"
    fi
    
    return 0
}

# Function to kill processes by PID from file
kill_by_pid_file() {
    local pid_file=$1
    local service_name=$2
    
    if [ -f "$pid_file" ]; then
        local pid=$(cat "$pid_file" 2>/dev/null)
        if [ -n "$pid" ] && kill -0 "$pid" 2>/dev/null; then
            print_status "Stopping $service_name (PID: $pid)..."
            
            # Try graceful shutdown first
            kill -TERM "$pid" 2>/dev/null || true
            sleep 3
            
            # Check if process is still running
            if kill -0 "$pid" 2>/dev/null; then
                print_warning "Process still running, forcing shutdown..."
                kill -9 "$pid" 2>/dev/null || true
            fi
            
            # Verify process is gone
            if ! kill -0 "$pid" 2>/dev/null; then
                print_success "$service_name stopped successfully"
                rm -f "$pid_file"
            else
                print_error "Failed to stop $service_name (PID: $pid)"
                return 1
            fi
        else
            print_status "No running $service_name process found"
            rm -f "$pid_file" 2>/dev/null || true
        fi
    else
        print_status "No $service_name PID file found"
    fi
    
    return 0
}

# Main execution starts here
print_status "Stopping Presidio Solution Proposal Generator..."
print_status "=============================================="

# Get the directory where the script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_DIR="$SCRIPT_DIR/logs"

# Stop services by PID files first (more precise)
if [ -d "$LOG_DIR" ]; then
    kill_by_pid_file "$LOG_DIR/backend.pid" "Backend"
    kill_by_pid_file "$LOG_DIR/frontend.pid" "Frontend"
fi

# Also stop any processes on the ports (cleanup)
kill_port_processes 3001 "Backend"
kill_port_processes 3000 "Frontend"

# Clean up log files if they exist
if [ -d "$LOG_DIR" ]; then
    print_status "Cleaning up PID files..."
    rm -f "$LOG_DIR/backend.pid" "$LOG_DIR/frontend.pid" 2>/dev/null || true
fi

print_success "=============================================="
print_success "✅ Application stopped successfully!"
print_success "=============================================="

# Check for any remaining processes (just for verification)
remaining_3000=$(lsof -ti:3000 2>/dev/null || true)
remaining_3001=$(lsof -ti:3001 2>/dev/null || true)

if [ -n "$remaining_3000" ] || [ -n "$remaining_3001" ]; then
    print_warning "Warning: Some processes may still be running:"
    [ -n "$remaining_3000" ] && print_warning "  Port 3000: $remaining_3000"
    [ -n "$remaining_3001" ] && print_warning "  Port 3001: $remaining_3001"
    print_status "You may need to manually kill these processes if they persist"
else
    print_status "All application processes have been stopped cleanly"
fi