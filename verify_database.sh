#!/bin/bash

# Database Verification Script for SmartBin

echo "🔍 SmartBin Database Verification"
echo "=================================="
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check if PostgreSQL is running
if ! docker ps | grep -q smartbin_postgres; then
    echo "${YELLOW}⚠️  PostgreSQL is not running. Start it with: make start${NC}"
    exit 1
fi

echo "${BLUE}📊 Checking Database Data...${NC}"
echo ""

# Count users
echo "${GREEN}Users in database:${NC}"
USER_COUNT=$(docker exec smartbin_postgres psql -U smartbin_user -d smartbin_db -t -c "SELECT COUNT(*) FROM auth_users;" | xargs)
echo "$USER_COUNT users"

# Show recent users
if [ "$USER_COUNT" -gt 0 ]; then
    echo ""
    echo "${GREEN}Recent users (last 5):${NC}"
    docker exec smartbin_postgres psql -U smartbin_user -d smartbin_db -c "SELECT username, email, points, qr_code FROM auth_users ORDER BY created_at DESC LIMIT 5;"
fi

# Count bins
echo ""
echo "${GREEN}Bins in database:${NC}"
BIN_COUNT=$(docker exec smartbin_postgres psql -U smartbin_user -d smartbin_db -t -c "SELECT COUNT(*) FROM bins;" | xargs)
echo "$BIN_COUNT bins"

# Show bins
if [ "$BIN_COUNT" -gt 0 ]; then
    echo ""
    echo "${GREEN}Recent bins:${NC}"
    docker exec smartbin_postgres psql -U smartbin_user -d smartbin_db -c "SELECT name, location, status FROM bins ORDER BY created_at DESC LIMIT 5;"
fi

# Count detections
echo ""
echo "${GREEN}Material detections:${NC}"
DETECTION_COUNT=$(docker exec smartbin_postgres psql -U smartbin_user -d smartbin_db -t -c "SELECT COUNT(*) FROM material_detections;" | xargs)
echo "$DETECTION_COUNT detections"

# Count reclamations
echo ""
echo "${GREEN}Reclamations:${NC}"
RECLAMATION_COUNT=$(docker exec smartbin_postgres psql -U smartbin_user -d smartbin_db -t -c "SELECT COUNT(*) FROM reclamations;" | xargs)
echo "$RECLAMATION_COUNT reclamations"

# Count points history
echo ""
echo "${GREEN}Points history entries:${NC}"
POINTS_COUNT=$(docker exec smartbin_postgres psql -U smartbin_user -d smartbin_db -t -c "SELECT COUNT(*) FROM auth_points_history;" | xargs)
echo "$POINTS_COUNT transactions"

echo ""
echo "${BLUE}✅ Database verification complete!${NC}"
echo ""
echo "${YELLOW}💡 To see more details, use: make db-shell${NC}"
