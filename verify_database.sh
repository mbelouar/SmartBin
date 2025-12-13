#!/bin/bash

# SmartBin Database Verification Script
# Shows all data in the database

echo "======================================"
echo "🗄️  SmartBin Database Verification"
echo "======================================"
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if PostgreSQL is running
if ! docker ps | grep -q smartbin_postgres; then
    echo "❌ PostgreSQL container is not running!"
    echo "Start it with: make start"
    exit 1
fi

echo -e "${GREEN}✅ PostgreSQL is running${NC}"
echo ""

# Users
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}👥 USERS${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
docker exec smartbin_postgres psql -U smartbin_user -d smartbin_db -c "
SELECT 
    username,
    email,
    points,
    qr_code,
    TO_CHAR(created_at, 'YYYY-MM-DD HH24:MI') as joined
FROM auth_users 
ORDER BY created_at DESC;
" 2>/dev/null

echo ""

# User Count
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}📊 USER STATISTICS${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
docker exec smartbin_postgres psql -U smartbin_user -d smartbin_db -c "
SELECT 
    COUNT(*) as total_users,
    SUM(points) as total_points,
    ROUND(AVG(points), 2) as avg_points_per_user
FROM auth_users;
" 2>/dev/null

echo ""

# Points History
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}💰 RECENT POINTS TRANSACTIONS${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
docker exec smartbin_postgres psql -U smartbin_user -d smartbin_db -c "
SELECT 
    u.username,
    ph.amount,
    ph.transaction_type,
    ph.description,
    TO_CHAR(ph.created_at, 'YYYY-MM-DD HH24:MI') as date
FROM auth_points_history ph
JOIN auth_users u ON ph.user_id = u.id
ORDER BY ph.created_at DESC
LIMIT 10;
" 2>/dev/null || echo "No points history found"

echo ""

# Bins
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}🗑️  BINS${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
docker exec smartbin_postgres psql -U smartbin_user -d smartbin_db -c "
SELECT 
    name,
    qr_code,
    location,
    status,
    fill_level || '%' as fill,
    is_open
FROM bins
ORDER BY created_at DESC;
" 2>/dev/null || echo "No bins found"

echo ""

# Bin Stats
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}📊 BIN STATISTICS${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
docker exec smartbin_postgres psql -U smartbin_user -d smartbin_db -c "
SELECT 
    COUNT(*) as total_bins,
    SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_bins,
    SUM(CASE WHEN status = 'full' THEN 1 ELSE 0 END) as full_bins,
    ROUND(AVG(fill_level), 2) as avg_fill_level
FROM bins;
" 2>/dev/null || echo "No bins found"

echo ""

# Material Detections
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}🔍 RECENT MATERIAL DETECTIONS${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
docker exec smartbin_postgres psql -U smartbin_user -d smartbin_db -c "
SELECT 
    material_type,
    confidence,
    points_awarded,
    points_added_to_user,
    TO_CHAR(created_at, 'YYYY-MM-DD HH24:MI') as detected_at
FROM material_detections
ORDER BY created_at DESC
LIMIT 10;
" 2>/dev/null || echo "No detections found"

echo ""

# Detection Stats
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}📊 DETECTION STATISTICS${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
docker exec smartbin_postgres psql -U smartbin_user -d smartbin_db -c "
SELECT 
    COUNT(*) as total_detections,
    SUM(CASE WHEN material_type = 'plastic' THEN 1 ELSE 0 END) as plastic,
    SUM(CASE WHEN material_type = 'paper' THEN 1 ELSE 0 END) as paper,
    SUM(CASE WHEN material_type = 'glass' THEN 1 ELSE 0 END) as glass,
    SUM(CASE WHEN material_type = 'metal' THEN 1 ELSE 0 END) as metal,
    SUM(CASE WHEN material_type = 'organic' THEN 1 ELSE 0 END) as organic,
    SUM(points_awarded) as total_points_awarded
FROM material_detections;
" 2>/dev/null || echo "No detections found"

echo ""

# Reclamations
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}⚠️  RECLAMATIONS${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
docker exec smartbin_postgres psql -U smartbin_user -d smartbin_db -c "
SELECT 
    title,
    reclamation_type,
    status,
    priority,
    TO_CHAR(created_at, 'YYYY-MM-DD HH24:MI') as reported
FROM reclamations
ORDER BY created_at DESC
LIMIT 10;
" 2>/dev/null || echo "No reclamations found"

echo ""

# Reclamation Stats
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}📊 RECLAMATION STATISTICS${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
docker exec smartbin_postgres psql -U smartbin_user -d smartbin_db -c "
SELECT 
    COUNT(*) as total_reclamations,
    SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
    SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress,
    SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END) as resolved
FROM reclamations;
" 2>/dev/null || echo "No reclamations found"

echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ Verification Complete!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "💡 Tips:"
echo "   - Access pgAdmin: http://localhost:5050"
echo "   - Django Admin: http://localhost:8001/admin/"
echo "   - SQL Shell: make db-shell"
echo ""
