#!/usr/bin/env bash
# ==============================================================================
# MAREA 1-CLICK AUTOMATED DEPLOYMENT & ENVIRONMENT SETUP SCRIPT
# Marine Aquaculture Risk & Early-warning Analytics
# Tested for: Ubuntu / Debian / Production VPS & Research Facilities
# ==============================================================================

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}==============================================================================${NC}"
echo -e "${BLUE}        PROJECT MAREA - AUTOMATED PRODUCTION & TESTING DEPLOYMENT             ${NC}"
echo -e "${BLUE}==============================================================================${NC}"

# 1. Check Docker Installation
echo -e "\n${YELLOW}[1/5] Checking Docker & Environment Prerequisites...${NC}"
if ! command -v docker &> /dev/null; then
    echo -e "${RED}[-] Docker is not installed. Please install Docker first.${NC}"
    exit 1
fi
echo -e "${GREEN}[+] Docker binary detected: $(docker --version)${NC}"

# Check Docker Compose (Plugin or standalone)
if docker compose version &> /dev/null; then
    COMPOSE_CMD="docker compose"
elif command -v docker-compose &> /dev/null; then
    COMPOSE_CMD="docker-compose"
else
    echo -e "${RED}[-] Docker Compose not found.${NC}"
    exit 1
fi
echo -e "${GREEN}[+] Docker Compose detected: $($COMPOSE_CMD version)${NC}"

# 2. Environment Configuration Setup
echo -e "\n${YELLOW}[2/5] Initializing Environment Variables...${NC}"
if [ ! -f ".env" ]; then
    echo -e "${BLUE}[*] Creating .env from production defaults...${NC}"
    cat <<EOF > .env
NODE_ENV=production
PORT=5000
DATABASE_URL=postgres://marea:marea_secret_2026@marea-db:5432/marea_db
POSTGRES_DB=marea_db
POSTGRES_USER=marea
POSTGRES_PASSWORD=marea_secret_2026
EOF
fi
echo -e "${GREEN}[+] Environment configuration ready.${NC}"

# 3. Build and Start Container Services
echo -e "\n${YELLOW}[3/5] Building & Launching Container Stack (TimescaleDB, API, Frontend, AI)...${NC}"
$COMPOSE_CMD down --remove-orphans || true
$COMPOSE_CMD build --no-cache
$COMPOSE_CMD up -d

# 4. Service Health Checks & Database Verification
echo -e "\n${YELLOW}[4/5] Waiting for Containers and Database initialization...${NC}"
sleep 8

MAX_RETRIES=15
RETRY_COUNT=0
HEALTHY=false

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if curl -s http://localhost:5000/api/health | grep -q "healthy"; then
        HEALTHY=true
        break
    fi
    echo -e "${YELLOW}[*] Waiting for backend API to become ready (attempt $((RETRY_COUNT+1))/$MAX_RETRIES)...${NC}"
    sleep 3
    RETRY_COUNT=$((RETRY_COUNT+1))
done

if [ "$HEALTHY" = false ]; then
    echo -e "${RED}[-] Health check failed! Inspecting backend logs:${NC}"
    $COMPOSE_CMD logs marea-backend
    exit 1
fi

echo -e "${GREEN}[+] MAREA Backend API is HEALTHY!${NC}"

# 5. Verification Summary
echo -e "\n${YELLOW}[5/5] Checking Running Services...${NC}"
$COMPOSE_CMD ps

echo -e "\n${GREEN}==============================================================================${NC}"
echo -e "${GREEN}  PROJECT MAREA DEPLOYED & FULLY OPERATIONAL!                                 ${NC}"
echo -e "${GREEN}==============================================================================${NC}"
echo -e "  - ${BLUE}Frontend Web Dashboard:${NC}   http://localhost:8080"
echo -e "  - ${BLUE}Backend API Health:${NC}       http://localhost:5000/api/health"
echo -e "  - ${BLUE}Telemetry Ingestion:${NC}      POST http://localhost:5000/api/telemetry"
echo -e "  - ${BLUE}AI Forecast Projections:${NC}  GET http://localhost:5000/api/forecast"
echo -e "  - ${BLUE}Database Connection:${NC}      postgres://marea:marea_secret_2026@localhost:5432/marea_db"
echo -e "${GREEN}==============================================================================${NC}"
