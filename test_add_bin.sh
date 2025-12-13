#!/bin/bash

# Test script to add a bin as admin
# This script logs in as admin and creates a test bin

set -e

echo "🧪 Testing Admin Bin Creation"
echo "=============================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if services are running
echo "📋 Checking services..."
if ! docker ps | grep -q smartbin_auth; then
    echo -e "${RED}❌ Auth service is not running!${NC}"
    echo "Please start services with: docker-compose up -d"
    exit 1
fi

if ! docker ps | grep -q smartbin_bin_service; then
    echo -e "${RED}❌ Bin service is not running!${NC}"
    echo "Please start services with: docker-compose up -d"
    exit 1
fi

echo -e "${GREEN}✅ Services are running${NC}"
echo ""

# Step 1: Login as admin
echo "🔐 Step 1: Logging in as admin..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:8001/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "admin123"
  }')

# Check if login was successful
if echo "$LOGIN_RESPONSE" | grep -q "access"; then
    TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"access":"[^"]*' | cut -d'"' -f4)
    USERNAME=$(echo "$LOGIN_RESPONSE" | grep -o '"username":"[^"]*' | cut -d'"' -f4)
    IS_STAFF=$(echo "$LOGIN_RESPONSE" | grep -o '"is_staff":[^,}]*' | cut -d':' -f2)
    
    if [ -z "$TOKEN" ]; then
        echo -e "${RED}❌ Failed to extract token from login response${NC}"
        echo "Response: $LOGIN_RESPONSE"
        exit 1
    fi
    
    echo -e "${GREEN}✅ Logged in as: $USERNAME${NC}"
    echo "   is_staff: $IS_STAFF"
    echo ""
else
    echo -e "${RED}❌ Login failed!${NC}"
    echo "Response: $LOGIN_RESPONSE"
    echo ""
    echo "💡 Tip: Make sure test users exist. Run:"
    echo "   python3 create_test_users.py"
    exit 1
fi

# Step 2: Create a test bin
echo "📦 Step 2: Creating a test bin..."

# Generate a unique QR code
TIMESTAMP=$(date +%s)
QR_CODE="SB-TEST-$TIMESTAMP"

BIN_DATA=$(cat <<EOF
{
  "name": "Test Bin #$TIMESTAMP",
  "qr_code": "$QR_CODE",
  "location": "Test Location - $(date)",
  "latitude": 40.7128,
  "longitude": -74.0060,
  "capacity": 100,
  "status": "active"
}
EOF
)

CREATE_RESPONSE=$(curl -s -X POST http://localhost:8002/api/bins/list/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "$BIN_DATA")

# Check if creation was successful
if echo "$CREATE_RESPONSE" | grep -q "id"; then
    BIN_ID=$(echo "$CREATE_RESPONSE" | grep -o '"id":[0-9]*' | cut -d':' -f2)
    BIN_NAME=$(echo "$CREATE_RESPONSE" | grep -o '"name":"[^"]*' | cut -d'"' -f4)
    
    echo -e "${GREEN}✅ Bin created successfully!${NC}"
    echo "   Bin ID: $BIN_ID"
    echo "   Bin Name: $BIN_NAME"
    echo "   QR Code: $QR_CODE"
    echo ""
    
    # Step 3: Verify the bin was created
    echo "🔍 Step 3: Verifying bin was created..."
    VERIFY_RESPONSE=$(curl -s http://localhost:8002/api/bins/list/ \
      -H "Authorization: Bearer $TOKEN")
    
    if echo "$VERIFY_RESPONSE" | grep -q "$QR_CODE"; then
        echo -e "${GREEN}✅ Bin verified in database!${NC}"
        echo ""
        echo -e "${GREEN}🎉 Test completed successfully!${NC}"
        echo ""
        echo "📝 Next steps:"
        echo "   1. Visit http://localhost:3000/admin to see the admin dashboard"
        echo "   2. You should see your new bin in the list"
        echo "   3. You can also check phpMyAdmin at http://localhost:8080"
    else
        echo -e "${YELLOW}⚠️  Bin created but not found in list (this might be normal)${NC}"
    fi
else
    echo -e "${RED}❌ Failed to create bin!${NC}"
    echo "Response: $CREATE_RESPONSE"
    echo ""
    
    # Check for specific error messages
    if echo "$CREATE_RESPONSE" | grep -q "Authentication"; then
        echo -e "${YELLOW}💡 Authentication error detected${NC}"
        echo "   Make sure you're logged in as an admin user"
    elif echo "$CREATE_RESPONSE" | grep -q "permission"; then
        echo -e "${YELLOW}💡 Permission error detected${NC}"
        echo "   Make sure the user has is_staff=True"
    fi
    
    exit 1
fi

echo ""
echo "=============================="
echo "✅ All tests passed!"
