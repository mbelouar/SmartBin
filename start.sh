#!/bin/bash

# SmartBin Startup Script
echo "🚀 Starting SmartBin Application..."
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker Desktop and try again."
    exit 1
fi

# Stop any existing containers
echo "${YELLOW}Stopping existing containers...${NC}"
docker-compose down 2>/dev/null

# Start infrastructure first (PostgreSQL, Mosquitto)
echo ""
echo "${BLUE}Step 1/3: Starting Infrastructure...${NC}"
docker-compose up -d postgres mosquitto

# Wait for PostgreSQL to be healthy
echo "Waiting for PostgreSQL to be ready..."
sleep 10

# Start microservices
echo ""
echo "${BLUE}Step 2/3: Starting Microservices...${NC}"
docker-compose up -d auth_service bin_service detection_service reclamation_service

# Wait for services to initialize
echo "Waiting for services to initialize..."
sleep 15

# Start frontend and Node-RED
echo ""
echo "${BLUE}Step 3/3: Starting Frontend & Node-RED...${NC}"
docker-compose up -d frontend node_red

echo ""
echo "${GREEN}✅ SmartBin is now running!${NC}"
echo ""
echo "📊 Service URLs:"
echo "   Frontend:           http://localhost:3000"
echo "   Node-RED:           http://localhost:1880"
echo "   Auth Service:       http://localhost:8001"
echo "   Bin Service:        http://localhost:8002"
echo "   Detection Service:  http://localhost:8003"
echo "   Reclamation Service: http://localhost:8004"
echo "   MQTT Broker:        mqtt://localhost:1883"
echo ""
echo "📝 Quick Start:"
echo "   1. Open http://localhost:3000 in your browser"
echo "   2. Register a new account"
echo "   3. Use Node-RED (http://localhost:1880) to simulate bin events"
echo ""
echo "🔍 View logs: docker-compose logs -f [service_name]"
echo "🛑 Stop all:  docker-compose down"
echo ""
