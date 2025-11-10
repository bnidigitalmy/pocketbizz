# Manual Testing Guide - Pricing Plans

## Summary of What Was Implemented

### ✅ Backend (Completed)
1. **Feature Gating Middleware** (`server/feature-gating.ts`)
   - `enforceProductLimit` - Blocks when product limit reached
   - `enforceVendorLimit` - Blocks when vendor limit reached
   - `enforceResellerLimit` - Blocks when reseller limit reached
   - `enforceStockLimit` - Blocks when stock item limit reached
   - `requireVendorClaims` - Pro+ only
   - `requireResellerNetwork` - Pro+ only
   - `requireAdvancedAnalytics` - Pro+ only

2. **Protected Routes** (`server/routes.ts`)
   - `POST /api/products` → enforceProductLimit
   - `POST /api/vendors` → enforceVendorLimit
   - `POST /api/resellers` → requireResellerNetwork + enforceResellerLimit
   - `POST /api/stock` → enforceStockLimit
   - `GET /api/vendor-claims` → requireVendorClaims
   - `GET /api/analytics/*` → requireAdvancedAnalytics

3. **New API Endpoint**
   - `GET /api/subscription/usage` - Returns real-time usage stats

### ✅ Frontend (Completed)
1. **Usage Stats Card** (`client/src/components/usage-stats-card.tsx`)
   - Real-time progress bars for all resources
   - Color-coded warnings (blue → orange → red)
   - Auto-refresh every 30 seconds
   - Upgrade button when hitting limits

2. **Upgrade Dialog** (already exists)
3. **Pricing Page** (already exists with Early Bird banner)

### ✅ Database (Completed)
- Schema updated with 20+ feature limit columns
- 4 pricing plans seeded (Trial, Basic, Pro, Premium)

---

## Automated Test Results

**Test run:** November 10, 2025

### Trial Plan (RM0/month)
- ✅ Products limit: 10
- ✅ Vendors limit: 2
- ✅ Resellers limit: 0
- ✅ Stock items limit: 20
- ✅ Vendor Claims: BLOCKED ✓
- ✅ Reseller Network: BLOCKED ✓
- ✅ Advanced Analytics: BLOCKED ✓

**Result:** ✅ ALL TESTS PASSED

---

## Manual Testing Steps

### Test 1: Trial Plan Limits (Already Tested ✅)
1. Register new account → Gets 14-day trial automatically
2. Try to create 11th product → Should be blocked with upgrade prompt
3. Try to access Vendor Claims → Should show "Pro+ required"
4. Try to access Reseller Network → Should show "Pro+ required"

### Test 2: Basic Plan (RM39/month)
**To test manually:**

1. **Create Basic user via SQL:**
   ```sql
   -- Run create-test-users.sql in Neon SQL Editor
   ```

2. **Login as Basic user and verify:**
   - ✅ Can create up to 50 products (vs 10 on Trial)
   - ✅ Can create up to 5 vendors (vs 2 on Trial)
   - ❌ Vendor Claims still BLOCKED
   - ❌ Reseller Network still BLOCKED
   - ❌ Advanced Analytics still BLOCKED

3. **Check usage stats:**
   - Navigate to Dashboard
   - Should see "Basic Plan" with higher limits

### Test 3: Pro Plan (RM89/month) ⭐ Most Popular
**To test manually:**

1. **Create Pro user via SQL** (or upgrade existing user)

2. **Login as Pro user and verify:**
   - ✅ Can create up to 200 products
   - ✅ Can create up to 20 vendors
   - ✅ Can create up to 10 resellers
   - ✅ Vendor Claims: GRANTED
   - ✅ Reseller Network: GRANTED
   - ✅ Advanced Analytics: GRANTED
   - ✅ Loyalty Points system enabled
   - ✅ WhatsApp/SMS broadcast enabled

3. **Check analytics page:**
   - Navigate to `/analytics`
   - Should see Product Performance charts
   - Should see Vendor Leaderboard
   - Should see Sales Trend analysis

### Test 4: Premium Plan (RM159/month)
**To test manually:**

1. **Create Premium user via SQL**

2. **Login as Premium user and verify:**
   - ✅ UNLIMITED products (999,999 limit)
   - ✅ UNLIMITED vendors
   - ✅ UNLIMITED resellers
   - ✅ All Pro features PLUS:
     - API Access
     - Custom Domain
     - Account Manager
     - Advanced Reporting

---

## Quick Test Commands

### 1. Test current logged-in user
```bash
# Login via browser first, then:
curl -b cookies.txt http://localhost:5000/api/subscription/usage | jq
```

### 2. Test premium feature blocking
```bash
# Should return 403 for Trial/Basic users:
curl -b cookies.txt http://localhost:5000/api/vendor-claims
curl -b cookies.txt http://localhost:5000/api/resellers
curl -b cookies.txt http://localhost:5000/api/analytics/product-performance
```

### 3. Test product limit
```bash
# Create 11 products for Trial user - 11th should fail with 403:
for i in {1..11}; do
  curl -X POST -b cookies.txt \
    -H "Content-Type: application/json" \
    -d '{
      "name": "Test Product '$i'",
      "category": "Cake",
      "sellingPrice": "25.00",
      "costPrice": "12.00",
      "unit": "pcs",
      "unitsPerBatch": "10",
      "labourCost": "5.00",
      "packagingCost": "2.00",
      "otherCosts": "1.00",
      "recipeItems": []
    }' \
    http://localhost:5000/api/products
done
```

---

## Expected Pricing Matrix

| Feature | Trial | Basic | Pro | Premium |
|---------|-------|-------|-----|---------|
| **Price** | RM0 | RM39 | RM89 | RM159 |
| **Products** | 10 | 50 | 200 | Unlimited |
| **Vendors** | 2 | 5 | 20 | Unlimited |
| **Resellers** | 0 | 0 | 10 | Unlimited |
| **Stock Items** | 20 | 100 | 500 | Unlimited |
| **Vendor Claims** | ❌ | ❌ | ✅ | ✅ |
| **Reseller Network** | ❌ | ❌ | ✅ | ✅ |
| **Advanced Analytics** | ❌ | ❌ | ✅ | ✅ |
| **Loyalty Points** | ❌ | ❌ | ✅ | ✅ |
| **WhatsApp Broadcast** | ❌ | ❌ | ✅ | ✅ |
| **Public Store** | ❌ | ❌ | ✅ | ✅ |
| **API Access** | ❌ | ❌ | ❌ | ✅ |
| **Custom Domain** | ❌ | ❌ | ❌ | ✅ |
| **Priority Support** | ❌ | ❌ | ✅ | ✅ |
| **Account Manager** | ❌ | ❌ | ❌ | ✅ |

---

## Testing Checklist

### Backend
- [x] Trial plan limits enforced (10 products, 2 vendors)
- [x] Premium features blocked for Trial users
- [x] Usage stats API returns correct limits
- [x] Build compiles without errors
- [ ] Basic plan limits enforced (50 products, 5 vendors)
- [ ] Pro plan grants premium features
- [ ] Premium plan grants all features

### Frontend
- [x] Usage stats card created
- [x] Upgrade dialog exists
- [x] Pricing page exists with Early Bird
- [ ] Usage stats card integrated in dashboard
- [ ] Upgrade prompts show when hitting limits
- [ ] Pricing page accessible from navigation

### Integration
- [ ] Trial → Basic upgrade flow
- [ ] Basic → Pro upgrade flow
- [ ] Pro → Premium upgrade flow
- [ ] Payment integration with ToyyibPay
- [ ] Early Bird discount applies correctly

---

## Next Steps for Production

1. **Complete Manual Testing**
   - Test Basic, Pro, Premium plans manually
   - Verify all limits work correctly
   - Test upgrade flows end-to-end

2. **UI Integration**
   - Add UsageStatsCard to Dashboard
   - Show upgrade prompts when hitting limits
   - Add pricing link to navigation menu

3. **Monitor & Optimize**
   - Track conversion rates (Trial → Paid)
   - Monitor which features drive upgrades
   - A/B test pricing messaging

4. **Deploy to Production**
   - Run final tests in staging
   - Deploy to Railway
   - Monitor errors in Sentry

---

## Support

If you encounter any issues:
1. Check server logs for detailed error messages
2. Verify database schema is up to date (`npm run db:push`)
3. Ensure pricing plans are seeded (`npm run db:seed-pricing`)
4. Contact tech support with error details

**Last updated:** November 10, 2025
