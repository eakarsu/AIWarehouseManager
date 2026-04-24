#!/bin/bash

# ============================================================
# AIWarehouseManager - Startup Script
# ============================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Project root
PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKEND_DIR="$PROJECT_DIR/backend"
FRONTEND_DIR="$PROJECT_DIR/frontend"

DB_NAME="ai_warehouse_manager"

# Track background PIDs for cleanup
BACKEND_PID=""

cleanup() {
  echo ""
  echo -e "${YELLOW}Shutting down...${NC}"
  if [ -n "$BACKEND_PID" ] && kill -0 "$BACKEND_PID" 2>/dev/null; then
    echo -e "${YELLOW}Stopping backend (PID $BACKEND_PID)...${NC}"
    kill "$BACKEND_PID" 2>/dev/null
    wait "$BACKEND_PID" 2>/dev/null
  fi
  echo -e "${GREEN}All processes stopped. Goodbye!${NC}"
  exit 0
}

trap cleanup SIGINT SIGTERM EXIT

print_step() {
  echo ""
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${CYAN}  $1${NC}"
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

print_success() {
  echo -e "${GREEN}  ✓ $1${NC}"
}

print_warning() {
  echo -e "${YELLOW}  ⚠ $1${NC}"
}

print_error() {
  echo -e "${RED}  ✗ $1${NC}"
}

# ============================================================
# Step 1: Check if PostgreSQL is running
# ============================================================
print_step "Step 1/9: Checking PostgreSQL"

if command -v pg_isready &>/dev/null; then
  if pg_isready &>/dev/null; then
    print_success "PostgreSQL is running"
  else
    print_warning "PostgreSQL is not running. Attempting to start..."
    if command -v brew &>/dev/null; then
      brew services start postgresql@16 2>/dev/null || brew services start postgresql 2>/dev/null || true
    elif command -v systemctl &>/dev/null; then
      sudo systemctl start postgresql 2>/dev/null || true
    fi
    sleep 2
    if pg_isready &>/dev/null; then
      print_success "PostgreSQL started successfully"
    else
      print_error "Could not start PostgreSQL. Please start it manually and re-run this script."
      exit 1
    fi
  fi
else
  print_warning "pg_isready not found. Assuming PostgreSQL is running."
fi

# ============================================================
# Step 2: Create database if it doesn't exist
# ============================================================
print_step "Step 2/9: Checking database '$DB_NAME'"

if command -v psql &>/dev/null; then
  if psql -lqt 2>/dev/null | cut -d \| -f 1 | grep -qw "$DB_NAME"; then
    print_success "Database '$DB_NAME' already exists"
  else
    print_warning "Database '$DB_NAME' not found. Creating..."
    createdb "$DB_NAME" 2>/dev/null && print_success "Database '$DB_NAME' created" || print_warning "Could not create database (it may already exist or require different credentials)"
  fi
else
  print_warning "psql not found. Skipping database check. Make sure the database exists."
fi

# ============================================================
# Step 3: Install backend dependencies
# ============================================================
print_step "Step 3/9: Installing backend dependencies"

cd "$BACKEND_DIR"
npm install
print_success "Backend dependencies installed"

# ============================================================
# Step 4: Generate Prisma client
# ============================================================
print_step "Step 4/9: Generating Prisma client"

cd "$BACKEND_DIR"
npx prisma generate
print_success "Prisma client generated"

# ============================================================
# Step 5: Push schema to database
# ============================================================
print_step "Step 5/9: Pushing schema to database"

cd "$BACKEND_DIR"
npx prisma db push
print_success "Schema pushed to database"

# ============================================================
# Step 6: Run seed
# ============================================================
print_step "Step 6/9: Seeding database"

cd "$BACKEND_DIR"
node src/seed.js
print_success "Database seeded"

# ============================================================
# Step 7: Install frontend dependencies
# ============================================================
print_step "Step 7/9: Installing frontend dependencies"

cd "$FRONTEND_DIR"
npm install
print_success "Frontend dependencies installed"

# ============================================================
# Step 8: Start backend with nodemon in background
# ============================================================
print_step "Step 8/9: Starting backend server"

cd "$BACKEND_DIR"
if command -v npx &>/dev/null && npx --no-install nodemon --version &>/dev/null 2>&1; then
  npx nodemon src/index.js &
else
  print_warning "nodemon not found, using node directly"
  node src/index.js &
fi
BACKEND_PID=$!
print_success "Backend started (PID $BACKEND_PID)"

# Give the backend a moment to start
sleep 2

# ============================================================
# Step 9: Start frontend with vite in foreground
# ============================================================
print_step "Step 9/9: Starting frontend dev server"

echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}  AIWarehouseManager is starting up!${NC}"
echo -e "${GREEN}  Backend:  http://localhost:5000${NC}"
echo -e "${GREEN}  Frontend: http://localhost:5173${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop all services${NC}"
echo ""

cd "$FRONTEND_DIR"
npx vite
