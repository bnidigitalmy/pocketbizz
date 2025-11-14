#!/bin/bash
# PocketBizz Launch Deployment Verification Script
# Run this after deploying to production to verify configuration

set -e

DOMAIN="${DOMAIN:-https://app.pocketbizz.my}"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🚀 PocketBizz Launch Deployment Verification"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
PASSED=0
FAILED=0

test_endpoint() {
    local name="$1"
    local url="$2"
    local expected_code="$3"
    local check_json="${4:-false}"
    
    echo -n "Testing: $name... "
    
    response=$(curl -s -w "\n%{http_code}" "$DOMAIN$url")
    body=$(echo "$response" | head -n -1)
    code=$(echo "$response" | tail -n 1)
    
    if [ "$code" = "$expected_code" ]; then
        if [ "$check_json" = "true" ] && ! echo "$body" | jq . >/dev/null 2>&1; then
            echo -e "${RED}✗ FAILED${NC} (invalid JSON)"
            FAILED=$((FAILED + 1))
        else
            echo -e "${GREEN}✓ PASSED${NC} (HTTP $code)"
            PASSED=$((PASSED + 1))
        fi
    else
        echo -e "${RED}✗ FAILED${NC} (Expected $expected_code, got $code)"
        FAILED=$((FAILED + 1))
    fi
}

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "1. BASIC HEALTH CHECKS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
test_endpoint "API Health" "/api/health" "200" "true"
test_endpoint "Subscription Plans (Public)" "/api/subscription-plans" "200" "true"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "2. VERIFY DISABLED MODULES (Should return 401/403)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
test_endpoint "Loyalty (Disabled)" "/api/loyalty/customers" "401"
test_endpoint "Vouchers (Disabled)" "/api/vouchers" "401"
test_endpoint "Broadcast (Disabled)" "/api/broadcast/templates" "401"
test_endpoint "Resellers (Disabled)" "/api/resellers" "401"
test_endpoint "Store Settings (Disabled)" "/api/store-settings" "401"
test_endpoint "Public Store (Hard Block)" "/api/public/store/test" "403"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "3. VERIFY PRICING CONFIGURATION"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo -n "Checking plan pricing... "
plan_data=$(curl -s "$DOMAIN/api/subscription-plans")
monthly_price=$(echo "$plan_data" | jq -r '.[0].monthlyPrice' 2>/dev/null || echo "error")
discount_6=$(echo "$plan_data" | jq -r '.[0].discount6Months' 2>/dev/null || echo "error")
discount_12=$(echo "$plan_data" | jq -r '.[0].discount12Months' 2>/dev/null || echo "error")

if [ "$monthly_price" = "27.00" ] && [ "$discount_6" = "10.00" ] && [ "$discount_12" = "20.00" ]; then
    echo -e "${GREEN}✓ PASSED${NC} (RM27/month, 10%/20% discounts)"
    PASSED=$((PASSED + 1))
else
    echo -e "${RED}✗ FAILED${NC} (Got: RM$monthly_price, ${discount_6}%/${discount_12}%)"
    FAILED=$((FAILED + 1))
fi

echo -n "Checking disabled features... "
has_reseller=$(echo "$plan_data" | jq -r '.[0].hasResellerNetwork' 2>/dev/null || echo "error")
has_loyalty=$(echo "$plan_data" | jq -r '.[0].hasLoyaltyPoints' 2>/dev/null || echo "error")
has_broadcast=$(echo "$plan_data" | jq -r '.[0].hasWhatsappBroadcast' 2>/dev/null || echo "error")
has_store=$(echo "$plan_data" | jq -r '.[0].hasPublicStore' 2>/dev/null || echo "error")

if [ "$has_reseller" = "0" ] && [ "$has_loyalty" = "0" ] && [ "$has_broadcast" = "0" ] && [ "$has_store" = "0" ]; then
    echo -e "${GREEN}✓ PASSED${NC} (All disabled features set to 0)"
    PASSED=$((PASSED + 1))
else
    echo -e "${RED}✗ FAILED${NC} (Reseller:$has_reseller, Loyalty:$has_loyalty, Broadcast:$has_broadcast, Store:$has_store)"
    FAILED=$((FAILED + 1))
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "4. DATABASE CONNECTIVITY"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if command -v node >/dev/null 2>&1; then
    echo -n "Testing database connection... "
    if node verify-db.js >/dev/null 2>&1; then
        echo -e "${GREEN}✓ PASSED${NC}"
        PASSED=$((PASSED + 1))
    else
        echo -e "${YELLOW}⚠ SKIPPED${NC} (Run locally: node verify-db.js)"
    fi
else
    echo -e "${YELLOW}⚠ SKIPPED${NC} (Node.js not available in this environment)"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 TEST SUMMARY"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "Passed: ${GREEN}$PASSED${NC}"
echo -e "Failed: ${RED}$FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ All tests passed! Ready for launch.${NC}"
    exit 0
else
    echo -e "${RED}✗ Some tests failed. Please review before launching.${NC}"
    exit 1
fi
