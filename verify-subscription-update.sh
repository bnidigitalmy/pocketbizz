#!/bin/bash
# Quick Verification Script for Subscription System Update
# Run: bash verify-subscription-update.sh

set -e

echo "🔍 PocketBizz Subscription System Verification"
echo "=============================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check 1: Files exist
echo "1️⃣  Checking files..."
files=(
  "server/subscription-service.ts"
  "tests/bcl-webhook.test.ts"
  "PAYMENT_SUBSCRIPTION_FLOW.md"
  "DEPLOYMENT_SUBSCRIPTION_UPDATE.md"
)

for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    echo -e "   ${GREEN}✓${NC} $file"
  else
    echo -e "   ${RED}✗${NC} $file (MISSING)"
    exit 1
  fi
done

echo ""

# Check 2: Database schema
echo "2️⃣  Checking database schema..."
if command -v psql &> /dev/null; then
  echo "   Verifying constraints and indexes..."
  
  # Check unique constraint
  CONSTRAINT_CHECK=$(psql $DATABASE_URL -t -c "
    SELECT COUNT(*) FROM pg_constraint 
    WHERE conname = 'unique_external_transaction_id'
  " 2>/dev/null | xargs || echo "0")
  
  if [ "$CONSTRAINT_CHECK" = "1" ]; then
    echo -e "   ${GREEN}✓${NC} unique_external_transaction_id constraint exists"
  else
    echo -e "   ${YELLOW}⚠${NC}  Constraint not found (run: npm run db:push)"
  fi
  
  # Check indexes
  INDEXES=(
    "user_subscriptions_user_id_idx"
    "user_subscriptions_status_idx"
    "user_subscriptions_external_tx_idx"
  )
  
  for idx in "${INDEXES[@]}"; do
    IDX_CHECK=$(psql $DATABASE_URL -t -c "
      SELECT COUNT(*) FROM pg_indexes 
      WHERE indexname = '$idx'
    " 2>/dev/null | xargs || echo "0")
    
    if [ "$IDX_CHECK" = "1" ]; then
      echo -e "   ${GREEN}✓${NC} Index: $idx"
    else
      echo -e "   ${YELLOW}⚠${NC}  Index missing: $idx"
    fi
  done
else
  echo -e "   ${YELLOW}⚠${NC}  psql not available, skipping DB check"
fi

echo ""

# Check 3: Environment variables
echo "3️⃣  Checking environment variables..."
required_vars=(
  "DATABASE_URL"
  "SESSION_SECRET"
  "BCL_WEBHOOK_SECRET"
)

for var in "${required_vars[@]}"; do
  if [ -n "${!var}" ]; then
    echo -e "   ${GREEN}✓${NC} $var is set"
  else
    echo -e "   ${RED}✗${NC} $var is NOT set"
  fi
done

echo ""

# Check 4: TypeScript compilation
echo "4️⃣  Checking TypeScript compilation..."
if npm run check > /dev/null 2>&1; then
  echo -e "   ${GREEN}✓${NC} TypeScript check passed"
else
  echo -e "   ${RED}✗${NC} TypeScript errors found (run: npm run check)"
fi

echo ""

# Check 5: Test webhook endpoint
echo "5️⃣  Testing webhook endpoint (if server running)..."
if curl -s http://localhost:5000/api/webhooks/bcl -X POST -H "Content-Type: application/json" -d '{}' > /dev/null 2>&1; then
  echo -e "   ${GREEN}✓${NC} Webhook endpoint responding"
else
  echo -e "   ${YELLOW}⚠${NC}  Server not running or endpoint not accessible"
fi

echo ""

# Summary
echo "=============================================="
echo "✅ Verification Complete"
echo ""
echo "Next steps:"
echo "  1. Run tests: npm test tests/bcl-webhook.test.ts"
echo "  2. Start server: npm run dev"
echo "  3. Test payment: Visit /subscription page"
echo "  4. Check docs: PAYMENT_SUBSCRIPTION_FLOW.md"
echo ""
echo "Ready for deployment? Review: DEPLOYMENT_SUBSCRIPTION_UPDATE.md"
