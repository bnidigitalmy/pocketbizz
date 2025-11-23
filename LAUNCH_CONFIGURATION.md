# PocketBizz Launch Configuration

**Date:** November 14, 2025  
**Purpose:** Pre-launch module disablement and pricing simplification for initial 5k user target

---

## 🎯 Launch Strategy

**Target:** 5,000 users within 6 months  
**Approach:** Single simplified plan, disabled premium modules, strict 7-day trial

---

## 🚫 Disabled Modules

The following modules have been **completely disabled** via feature gating and route middleware:

### 1. **Pelanggan Setia (Loyalty Points)**
- **Routes:** All `/api/loyalty/*` and `/api/vouchers*` endpoints return 403
- **Gating:** `requireLoyaltyPoints` middleware applied
- **Feature Flag:** `hasLoyaltyPoints: 0` (global disable)
- **Voucher Redemption:** Blocked in sales creation with early 403 return

### 2. **Broadcast (WhatsApp/SMS)**
- **Routes:** All `/api/broadcast/*` endpoints return 403
- **Gating:** `requireWhatsappBroadcast` middleware applied
- **Feature Flags:** `hasWhatsappBroadcast: 0`, `hasSmsBroadcast: 0`

### 3. **Vouchers**
- **Routes:** All `/api/vouchers*` endpoints return 403
- **Gating:** Mapped to `requireLoyaltyPoints` (vouchers = loyalty points)
- **Sales Integration:** Blocked voucher redemption in POST `/api/sales`

### 4. **Reseller/Agent Network**
- **Routes:** All `/api/resellers*` and `/api/reseller-transfers*` endpoints gated
- **Gating:** `requireResellerNetwork` middleware applied
- **Feature Flag:** `hasResellerNetwork: 0`, `maxResellers: 0` (global disable)

### 5. **Store Catalog (Katalog Kedai)**
- **Routes:** 
  - `/api/store-settings` (all methods) return 403
  - `/api/public/store/:slug` GET/POST return 403 (hard block)
- **Gating:** `requirePublicStore` middleware applied
- **Feature Flag:** `hasPublicStore: 0`

**Implementation Files:**
- `server/feature-gating.ts` - Global feature flag overrides
- `server/routes.ts` - Route-level middleware and hard 403 blocks

---

## 💰 Pricing Configuration

### Single Plan: **PocketBizz Plan**

**Base Price:** RM27/month (RM0.90/day)

#### Duration Options & Discounts

| Duration | Base Price | Discount | Final Price (Rounded) | Savings |
|----------|------------|----------|----------------------|---------|
| 1 month  | RM27       | 0%       | **RM27**             | -       |
| 3 months | RM81       | 3%       | **RM79**             | RM2     |
| 6 months | RM162      | 10%      | **RM146**            | RM16    |
| 12 months| RM324      | 20%      | **RM259**            | RM65    |

**Key Features:**
- All amounts rounded to **whole MYR (no cents)**
- Discounts apply **before rounding**
- Early-bird (70%) and promo codes stack with duration discounts
- Rounding happens **after all discounts**

#### Calculation Flow
```javascript
// Base calculation
const monthlyPrice = 27;
let totalPrice = monthlyPrice * durationMonths;

// Apply duration discount
if (durationMonths === 3) totalPrice *= 0.97;      // 3%
else if (durationMonths === 6) totalPrice *= 0.90; // 10%
else if (durationMonths === 12) totalPrice *= 0.80; // 20%

// Apply early-bird/promo if applicable
if (hasEarlyBird) totalPrice *= 0.30; // 70% off
if (promoCode) totalPrice = applyPromo(totalPrice);

// Final rounding (no cents)
totalPrice = Math.round(totalPrice);
```

**Implementation:**
- `server/routes.ts` - Fixed RM27 base in `/api/subscription/create-bill` and `/api/subscription/renew`
- `server/seed-plans.ts` - Plan seeding script with rounded amounts
- Plan display endpoint hardcoded to RM27 with 3%/10%/20% discounts

---

## ⏱️ Trial Policy

**Duration:** **7 days** (strict, no grace period)

### Changes from Previous Setup
- ✅ Trial now **exactly 7 days** from signup
- ❌ Removed 3-day grace period (`graceEndsAt` no longer set)
- ✅ `isTrialExpired()` checks only `trialEndsAt`
- ✅ Auto-disable trial on expiry

**Trial Features:**
- Full access to all enabled modules
- Conservative limits during trial (e.g., 10 products)
- Auto-upgrade prompt on expiry

**Implementation:**
- `server/routes.ts` - Registration no longer sets `graceEndsAt`
- `server/routes.ts` - Simplified `isTrialExpired()` helper

---

## 🔒 Feature Flags (Active Plan)

All subscriptions and trials enforce these flags:

```javascript
{
  hasResellerNetwork: 0,      // ❌ Disabled
  hasLoyaltyPoints: 0,         // ❌ Disabled (includes vouchers)
  hasBookings: 0,              // ❌ Disabled
  hasWhatsappBroadcast: 0,     // ❌ Disabled
  hasSmsBroadcast: 0,          // ❌ Disabled
  hasPublicStore: 0,           // ❌ Disabled
  hasVendorClaims: 1,          // ✅ Enabled
  hasAdvancedAnalytics: 1,     // ✅ Enabled
  hasCustomDomain: 0,          // ❌ Disabled
  maxResellers: 0,             // ❌ Zero resellers allowed
}
```

**Enforcement:**
- `server/feature-gating.ts` - `getUserPlan()` returns disabled flags for all users
- Applied to both trial users and paid subscribers

---

## 📊 Resource Limits (Launch Quotas)

Conservative limits for launch to ensure system stability:

| Resource          | Trial | Paid Plan |
|-------------------|-------|-----------|
| Products          | 10    | 100       |
| Customers         | -     | 200       |
| Stock Items       | -     | 100       |
| Vendors           | -     | 5         |
| Resellers         | 0     | 0         |
| Deliveries/Month  | -     | 50        |
| Storage           | -     | 500 MB    |

**Note:** These are soft limits enforced by middleware; can be increased post-launch.

---

## 🚀 Deployment Checklist

### Pre-Deployment

- [ ] **Seed Production Plan**
  ```bash
  npm run db:push  # Apply schema
  node server/seed-plans.ts  # Create RM27 plan
  ```

- [ ] **Verify Database**
  ```bash
  node verify-db.js
  ```

- [ ] **Check Environment Variables**
  - `DATABASE_URL` - Neon PostgreSQL connection
  - `SESSION_SECRET` - 64-byte random hex
  - `REDIS_URL` - Optional (falls back to PostgreSQL)
  - `ALLOWED_ORIGINS` - CORS whitelist
  - `CRON_SECRET` - Secure cron endpoints
  - `TOYYIBPAY_SECRET_KEY` - Payment gateway
  - `TOYYIBPAY_CATEGORY_CODE` - ToyyibPay category

- [ ] **Build for Production**
  ```bash
  npm run build
  ```

### Post-Deployment

- [ ] **Health Check**
  ```bash
  curl https://app.pocketbizz.my/api/health
  ```

- [ ] **Verify Plans Endpoint**
  ```bash
  curl https://app.pocketbizz.my/api/subscription-plans
  # Should return single plan with RM27 monthly price
  ```

- [ ] **Test Registration Flow**
  - Sign up new user
  - Verify 7-day trial active
  - Check trial expiry date (exactly 7 days, no grace)

- [ ] **Test Disabled Modules**
  - Try accessing `/api/loyalty/customers` → 403
  - Try accessing `/api/broadcast/templates` → 403
  - Try accessing `/api/vouchers` → 403
  - Try accessing `/api/resellers` → 403
  - Try accessing `/api/public/store/test` → 403

- [ ] **Monitor Error Logs**
  ```bash
  # Check Railway logs or Sentry dashboard
  ```

---

## 📁 Modified Files Summary

### Core Changes
1. **server/feature-gating.ts**
   - Added global disable flags for loyalty, reseller, broadcast, public store
   - Set `maxResellers: 0` for all plans
   - Added vouchers → loyalty mapping

2. **server/routes.ts**
   - Gated loyalty endpoints with `requireLoyaltyPoints`
   - Gated voucher endpoints with `requireLoyaltyPoints`
   - Blocked voucher redemption in sales creation
   - Gated broadcast endpoints with `requireWhatsappBroadcast`
   - Gated reseller endpoints with `requireResellerNetwork`
   - Gated store settings with `requirePublicStore`
   - Hard-blocked public store GET/POST endpoints
   - Fixed plan endpoint to RM27 with 3%/10%/20% discounts
   - Fixed billing to use RM27 base + fixed discounts
   - Added whole-MYR rounding to billing
   - Removed grace period from trial logic
   - Allowed 1/3/6/12 month durations

3. **server/seed-plans.ts**
   - Updated console output to show RM27 pricing
   - Displays rounded amounts: RM27, RM79, RM146, RM259

---

## 🎯 Success Metrics (6-Month Target)

Track these KPIs to measure launch success:

1. **User Growth**
   - Target: 5,000 registered users
   - Conversion rate: Trial → Paid (target: 15-20%)

2. **System Performance**
   - API response time: < 200ms (p95)
   - Database query time: < 50ms (p95)
   - Uptime: > 99.5%

3. **Revenue**
   - MRR (Monthly Recurring Revenue)
   - ARPU (Average Revenue Per User)
   - Churn rate: < 5%

4. **Support**
   - Support ticket volume
   - Average resolution time

---

## 🔄 Future Considerations

### Post-Launch Re-enablement Plan
When ready to enable disabled modules:

1. **Loyalty & Vouchers**
   - Remove `requireLoyaltyPoints` middleware
   - Set `hasLoyaltyPoints: 1` in feature-gating
   - Test voucher redemption in sales flow

2. **Broadcast**
   - Configure WhatsApp/SMS providers
   - Remove `requireWhatsappBroadcast` middleware
   - Set broadcast flags to 1

3. **Reseller Network**
   - Remove `requireResellerNetwork` middleware
   - Set `hasResellerNetwork: 1`, `maxResellers` to plan limit

4. **Public Store**
   - Remove 403 blocks from public endpoints
   - Remove `requirePublicStore` from settings
   - Set `hasPublicStore: 1`

### Scalability Enhancements
For 5k+ users:

- Add database indices on frequently queried columns
- Implement Redis-based rate limiting (not just memory)
- Add observability with metrics/tracing (Sentry + custom)
- Optimize N+1 queries in sales/delivery reports
- Consider CDN for static assets

---

## 📞 Support

For deployment issues or questions:
- Check `DEPLOYMENT.md` for detailed Railway setup
- Review `SECURITY_IMPLEMENTATION.md` for security posture
- See `CRON_SETUP_GUIDE.md` for background jobs

---

**Last Updated:** November 14, 2025  
**Status:** ✅ Ready for Launch
