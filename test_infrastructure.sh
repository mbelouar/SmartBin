#!/bin/bash

# SmartBin Infrastructure Test Script
# This script tests the basic infrastructure (PostgreSQL and MQTT)

set -e

echo "========================================"
echo "🚀 SmartBin Infrastructure Test"
echo "========================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo ""
echo "📋 Step 1: Checking prerequisites..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running. Please start Docker first.${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Docker is running${NC}"

# Check if docker-compose is available
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}❌ docker-compose not found. Please install docker-compose.${NC}"
    exit 1
fi
echo -e "${GREEN}✅ docker-compose is available${NC}"

echo ""
echo "📋 Step 2: Starting infrastructure services..."
echo -e "${YELLOW}Starting PostgreSQL and Mosquitto...${NC}"

# Start only infrastructure services
docker-compose -f docker-compose.test.yml up -d

echo ""
echo "⏳ Waiting for services to be healthy (30 seconds)..."
sleep 10

# Check PostgreSQL
echo ""
echo "🔍 Testing PostgreSQL..."
if docker exec smartbin_postgres_test pg_isready -U smartbin_user -d smartbin_db > /dev/null 2>&1; then
    echo -e "${GREEN}✅ PostgreSQL is healthy${NC}"
    docker exec smartbin_postgres_test psql -U smartbin_user -d smartbin_db -c "SELECT schema_name FROM information_schema.schemata WHERE schema_name IN ('auth', 'bins', 'detection', 'reclamation');"
else
    echo -e "${RED}❌ PostgreSQL is not responding${NC}"
fi

# Check Mosquitto
echo ""
echo "🔍 Testing MQTT Broker (Mosquitto)..."
if docker exec smartbin_mosquitto_test mosquitto_sub -t '$$SYS/#' -C 1 -i healthcheck -W 3 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ MQTT Broker is healthy${NC}"
else
    echo -e "${RED}❌ MQTT Broker is not responding${NC}"
fi

echo ""
echo "📊 Service Status:"
docker-compose -f docker-compose.test.yml ps

echo ""
echo "========================================"
echo "🎉 Infrastructure test complete!"
echo "========================================"
echo ""
echo "Services are running:"
echo "  - PostgreSQL: localhost:5432"
echo "  - MQTT Broker: localhost:1883"
echo "  - MQTT WebSocket: localhost:9001"
echo ""
echo "To view logs:"
echo "  docker-compose -f docker-compose.test.yml logs -f"
echo ""
echo "To stop services:"
echo "  docker-compose -f docker-compose.test.yml down"
echo ""
echo "To test connectivity with Python:"
echo "  pip install psycopg2-binary paho-mqtt"
echo "  python test_infrastructure.py"
echo ""
