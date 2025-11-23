#!/bin/bash

# Test script for cron endpoint
# Usage: ./test-cron.sh [production|local]

ENVIRONMENT=${1:-local}

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "🧪 Testing Cron Endpoint - Environment: $ENVIRONMENT"
echo "=================================================="

# Set URL based on environment
if [ "$ENVIRONMENT" = "production" ]; then
    URL="https://pocketbizz-production.up.railway.app"
    echo "🌐 Testing PRODUCTION: $URL"
    echo ""
    echo "⚠️  Make sure CRON_SECRET is set in Railway environment variables!"
    echo ""
    read -p "Enter CRON_SECRET: " CRON_SECRET
else
    URL="http://localhost:5000"
    echo "💻 Testing LOCAL: $URL"
    echo ""
    # For local testing, use a default or read from .env
    CRON_SECRET=${CRON_SECRET:-"test-secret-123"}
    echo "Using CRON_SECRET: $CRON_SECRET"
fi

echo ""
echo "=================================================="
echo ""

# Test 1: Health check
echo "Test 1: Health Check"
echo "--------------------"
HEALTH_RESPONSE=$(curl -s "$URL/api/cron/health")
echo "Response: $HEALTH_RESPONSE"

if echo "$HEALTH_RESPONSE" | grep -q "ok"; then
    echo -e "${GREEN}✅ Health check passed${NC}"
else
    echo -e "${RED}❌ Health check failed${NC}"
fi

echo ""
echo "=================================================="
echo ""

# Test 2: Unauthorized access (no secret)
echo "Test 2: Unauthorized Access (no secret)"
echo "----------------------------------------"
UNAUTH_RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST "$URL/api/cron/enforce-grace-period")
HTTP_CODE=$(echo "$UNAUTH_RESPONSE" | grep "HTTP_CODE:" | cut -d: -f2)
BODY=$(echo "$UNAUTH_RESPONSE" | grep -v "HTTP_CODE:")

echo "HTTP Status: $HTTP_CODE"
echo "Response: $BODY"

if [ "$HTTP_CODE" = "401" ]; then
    echo -e "${GREEN}✅ Correctly rejected unauthorized access${NC}"
else
    echo -e "${RED}❌ Should have returned 401, got $HTTP_CODE${NC}"
fi

echo ""
echo "=================================================="
echo ""

# Test 3: Authorized access (with secret)
echo "Test 3: Authorized Access (with correct secret)"
echo "------------------------------------------------"
AUTH_RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST "$URL/api/cron/enforce-grace-period" \
    -H "x-cron-secret: $CRON_SECRET")
HTTP_CODE=$(echo "$AUTH_RESPONSE" | grep "HTTP_CODE:" | cut -d: -f2)
BODY=$(echo "$AUTH_RESPONSE" | grep -v "HTTP_CODE:")

echo "HTTP Status: $HTTP_CODE"
echo "Response: $BODY"

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✅ Successfully executed grace period check${NC}"
    
    # Parse and display results
    if echo "$BODY" | grep -q "success.*true"; then
        PROCESSED=$(echo "$BODY" | grep -o '"processed":[0-9]*' | cut -d: -f2)
        echo "  → Processed $PROCESSED users"
    fi
else
    echo -e "${RED}❌ Request failed with status $HTTP_CODE${NC}"
fi

echo ""
echo "=================================================="
echo ""

# Test 4: Wrong secret
echo "Test 4: Wrong Secret"
echo "--------------------"
WRONG_RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST "$URL/api/cron/enforce-grace-period" \
    -H "x-cron-secret: wrong-secret-123")
HTTP_CODE=$(echo "$WRONG_RESPONSE" | grep "HTTP_CODE:" | cut -d: -f2)

echo "HTTP Status: $HTTP_CODE"

if [ "$HTTP_CODE" = "401" ]; then
    echo -e "${GREEN}✅ Correctly rejected wrong secret${NC}"
else
    echo -e "${RED}❌ Should have returned 401, got $HTTP_CODE${NC}"
fi

echo ""
echo "=================================================="
echo ""
echo "🎉 Test Suite Complete!"
echo ""
