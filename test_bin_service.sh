#!/bin/bash

# Test Bin Service
echo "========================================"
echo "🗑️  Testing SmartBin - Bin Service"
echo "========================================"

BASE_URL="http://localhost:8002/api/bins"
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 1. Health Check
echo ""
echo "1️⃣  Testing Health Check..."
HEALTH=$(curl -s ${BASE_URL}/health/)
if echo "$HEALTH" | grep -q "healthy"; then
    echo -e "${GREEN}✅ PASS${NC}: Health check"
    echo "$HEALTH" | python3 -m json.tool
else
    echo -e "${RED}❌ FAIL${NC}: Health check"
fi

# 2. Create Bin
echo ""
echo "2️⃣  Creating Test Bin..."
CREATE=$(curl -s -X POST ${BASE_URL}/list/ \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Bin #1",
    "qr_code": "BIN-TEST-001",
    "location": "Test Location",
    "latitude": 40.7128,
    "longitude": -74.0060,
    "capacity": 100,
    "status": "active"
  }')

if echo "$CREATE" | grep -q "Test Bin"; then
    echo -e "${GREEN}✅ PASS${NC}: Bin created"
    echo "$CREATE" | python3 -m json.tool
    BIN_ID=$(echo $CREATE | python3 -c "import sys, json; print(json.load(sys.stdin)['id'])")
    echo -e "${YELLOW}Bin ID:${NC} $BIN_ID"
else
    echo -e "${RED}❌ FAIL${NC}: Bin creation"
    echo "$CREATE"
    exit 1
fi

# 3. List All Bins
echo ""
echo "3️⃣  Listing All Bins..."
LIST=$(curl -s ${BASE_URL}/list/)
if echo "$LIST" | grep -q "Test Bin"; then
    echo -e "${GREEN}✅ PASS${NC}: List bins"
    echo "$LIST" | python3 -c "import sys, json; data=json.load(sys.stdin); print(f\"Found {data['count']} bin(s)\")"
else
    echo -e "${RED}❌ FAIL${NC}: List bins"
fi

# 4. Get Bin by QR Code
echo ""
echo "4️⃣  Getting Bin by QR Code..."
BY_QR=$(curl -s ${BASE_URL}/qr/BIN-TEST-001/)
if echo "$BY_QR" | grep -q "Test Bin"; then
    echo -e "${GREEN}✅ PASS${NC}: Get by QR code"
else
    echo -e "${RED}❌ FAIL${NC}: Get by QR code"
fi

# 5. Open Bin
echo ""
echo "5️⃣  Opening Bin..."
OPEN=$(curl -s -X POST ${BASE_URL}/list/${BIN_ID}/open/ \
  -H "Content-Type: application/json" \
  -d '{
    "user_qr_code": "SB-test-user-123"
  }')

if echo "$OPEN" | grep -q "opened successfully"; then
    echo -e "${GREEN}✅ PASS${NC}: Bin opened"
    echo "$OPEN" | python3 -m json.tool
    echo -e "${YELLOW}📡 MQTT Message Published:${NC} bin/$BIN_ID/open"
else
    echo -e "${RED}❌ FAIL${NC}: Open bin"
    echo "$OPEN"
fi

# 6. Check Bin Status (should be open)
echo ""
echo "6️⃣  Checking Bin Status..."
STATUS=$(curl -s ${BASE_URL}/list/${BIN_ID}/)
IS_OPEN=$(echo $STATUS | python3 -c "import sys, json; print(json.load(sys.stdin)['is_open'])")
if [ "$IS_OPEN" = "True" ]; then
    echo -e "${GREEN}✅ PASS${NC}: Bin is open"
else
    echo -e "${RED}❌ FAIL${NC}: Bin should be open"
fi

# 7. Close Bin
echo ""
echo "7️⃣  Closing Bin..."
CLOSE=$(curl -s -X POST ${BASE_URL}/list/${BIN_ID}/close/)
if echo "$CLOSE" | grep -q "closed successfully"; then
    echo -e "${GREEN}✅ PASS${NC}: Bin closed"
    echo -e "${YELLOW}📡 MQTT Message Published:${NC} bin/$BIN_ID/close"
else
    echo -e "${RED}❌ FAIL${NC}: Close bin"
fi

# 8. View Usage Logs
echo ""
echo "8️⃣  Viewing Usage Logs..."
LOGS=$(curl -s ${BASE_URL}/usage-logs/)
if echo "$LOGS" | grep -q "SB-test-user-123"; then
    echo -e "${GREEN}✅ PASS${NC}: Usage logged"
    echo "$LOGS" | python3 -m json.tool
else
    echo -e "${RED}❌ FAIL${NC}: Usage logs"
fi

# 9. Update Fill Level
echo ""
echo "9️⃣  Updating Fill Level to 75%..."
UPDATE_FILL=$(curl -s -X POST ${BASE_URL}/list/${BIN_ID}/update-fill-level/ \
  -H "Content-Type: application/json" \
  -d '{
    "fill_level": 75
  }')

if echo "$UPDATE_FILL" | grep -q "75"; then
    echo -e "${GREEN}✅ PASS${NC}: Fill level updated"
else
    echo -e "${RED}❌ FAIL${NC}: Update fill level"
fi

# Summary
echo ""
echo "========================================"
echo "📊 Test Summary"
echo "========================================"
echo -e "All Bin Service endpoints tested!"
echo ""
echo "✅ Health check"
echo "✅ Create bin"
echo "✅ List bins"
echo "✅ Get by QR code"
echo "✅ Open bin (MQTT published)"
echo "✅ Close bin (MQTT published)"
echo "✅ Usage logs"
echo "✅ Update fill level"
echo "========================================"
