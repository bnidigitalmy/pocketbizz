# 🔄 Payment & Subscription Flow - Enhanced Implementation

**Status**: ✅ Implemented & Hardened  
**Last Updated**: November 15, 2025

---

## 🎯 Overview

Sistem langganan PocketBizz kini menggunakan flow yang diperbaiki dengan **strict validation**, **idempotency**, **trial termination**, dan **audit logging**. Flow ini mengelakkan masalah duplicate payments, amount tampering, dan race conditions.

---

## 📊 Complete Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     USER JOURNEY                                 │
└─────────────────────────────────────────────────────────────────┘

1. USER PILIH PAKEJ
   └─> Client: /subscription page
       └─> Paparkan 4 pilihan: 1, 3, 6, 12 bulan
           ├─> RM27 (1 bulan)
           ├─> RM79 (3 bulan)
           ├─> RM146 (6 bulan)
           └─> RM259 (12 bulan)

2. REDIRECT KE BCL.MY
   └─> URL: https://bnidigital.bcl.my/form/{durasi}-bulan
       └─> User isi email (must match registered email)
           └─> Bayar via FPX/Kad/E-wallet

3. BCL WEBHOOK (BACKEND)
   └─> POST /api/webhooks/bcl
       ├─> Verify signature (REQUIRED in production)
       ├─> Validate event = "payment-success"
       ├─> Validate currency = "MYR"
       ├─> Validate is_paid = true/completed
       ├─> Extract package (form_title → amount fallback)
       ├─> Strict amount match (no tolerance)
       └─> Call subscriptionService.activateSubscription()

4. SUBSCRIPTION SERVICE (TRANSACTIONAL)
   └─> BEGIN TRANSACTION
       ├─> Check idempotency (externalTransactionId exists?)
       │   └─> IF YES: Return cached result (no duplicate)
       ├─> Find user by email
       ├─> Find active subscription
       │   ├─> IF EXISTS: EXTEND (add months to end date)
       │   └─> IF NOT: CREATE (new subscription)
       ├─> Terminate trial (isOnTrial = 0)
       ├─> Log billing history (audit trail)
       └─> COMMIT

5. RESPONSE & UI UPDATE
   └─> Webhook returns detailed response:
       ├─> isNewSubscription (true/false)
       ├─> wasOnTrial (true/false)
       ├─> previousEndsAt (if extended)
       ├─> newEndsAt
       ├─> extendedMonths
       └─> totalMonths
   └─> Client auto-refreshes (5s polling)
       └─> Shows "Langganan Dipanjangkan" notice
```

---

## 🔒 Security Enhancements

### 1. Signature Verification (STRICT)
```typescript
// REQUIRED in production
if (process.env.NODE_ENV === "production" && !signature) {
  return res.status(401).json({ error: "Signature required" });
}

// HMAC SHA256 verification
const isValid = verifyBCLSignature(rawBody, signature, webhookSecret);
```

### 2. Amount Validation (NO TOLERANCE)
```typescript
// Old: ±RM2 tolerance ❌
// New: Exact match only ✅
if (Math.abs(params.amount - packageConfig.price) > 0.01) {
  throw new Error("Amount mismatch");
}
```

### 3. Event Filtering (STRICT)
```typescript
// Old: Accepts "form-submit" & "payment-success" ❌
// New: Only "payment-success" ✅
if (payload.event !== "payment-success") {
  return res.json({ message: "Event ignored" });
}
```

### 4. Currency Validation
```typescript
if (currency !== "MYR") {
  return res.status(400).json({ error: "Invalid currency" });
}
```

---

## 🎯 Idempotency Implementation

### Database Schema
```sql
-- Unique constraint prevents duplicate processing
ALTER TABLE user_subscriptions 
ADD CONSTRAINT unique_external_transaction_id 
UNIQUE (external_transaction_id);

-- Index for fast lookup
CREATE INDEX user_subscriptions_external_tx_idx 
ON user_subscriptions(external_transaction_id);
```

### Service Layer Logic
```typescript
// 1. Check if transaction already processed
const existing = await tx.select()
  .from(userSubscriptions)
  .where(eq(userSubscriptions.externalTransactionId, params.transactionId))
  .limit(1);

if (existing.length > 0) {
  // Return cached result - NO duplicate insertion
  return {
    success: true,
    isNewSubscription: false,
    message: "Transaction already processed (idempotent response)",
    // ... return existing data
  };
}

// 2. Process only if new
// ... create/extend subscription
```

**Benefits**:
- ✅ Duplicate webhooks return same result
- ✅ No duplicate subscriptions
- ✅ No double billing
- ✅ Race conditions prevented

---

## 🔄 Subscription Extension Logic

### Scenario 1: First Payment (New Subscription)
```typescript
User: Trial (7 days) → Pays RM79 (3 months)
Result:
  - Trial terminated (isOnTrial = 0)
  - Subscription created
  - subscriptionStartsAt = NOW
  - subscriptionEndsAt = NOW + 3 months
  - status = "active"
```

### Scenario 2: Extension (Existing Subscription)
```typescript
User: Active subscription ends 2026-02-15 → Pays RM146 (6 months)
Result:
  - Find active subscription
  - previousEndsAt = 2026-02-15
  - newEndsAt = 2026-02-15 + 6 months = 2026-08-15
  - durationMonths = 3 + 6 = 9 (cumulative)
  - New record with status = "superseded" (audit trail)
  - Update original with extended end date
```

### Scenario 3: Duplicate Webhook
```typescript
User: Pays RM79 → Webhook arrives twice (retry)
First: Creates subscription SUB-001
Second: Detects existing externalTransactionId
  → Returns SUB-001 (no new record)
```

---

## 📋 Billing Audit Trail

### billingHistory Table
```typescript
{
  userId: "user-123",
  subscriptionId: "sub-456",
  amount: "79",
  currency: "MYR",
  status: "succeeded", // succeeded | failed | pending | refunded
  paymentMethod: "FPX",
  description: "Subscription payment - 3 months",
  toyyibpayTransactionId: "ORDER-789",
  paidAt: "2025-11-15T10:30:00Z",
}
```

**Benefits**:
- ✅ Full payment history
- ✅ Refund tracking (future)
- ✅ Dispute resolution
- ✅ Financial reporting

---

## 🧪 Testing Scenarios

### 1. Test Idempotency
```bash
# Send same webhook twice
curl -X POST http://localhost:5000/api/webhooks/bcl/test \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "months": 3,
    "amount": 79
  }'

# Second call should return isNewSubscription: false
```

### 2. Test Extension
```bash
# First payment
curl -X POST /api/webhooks/bcl/test -d '{"email":"test@example.com","months":3,"amount":79}'

# Second payment (different transaction ID)
curl -X POST /api/webhooks/bcl/test -d '{"email":"test@example.com","months":6,"amount":146}'

# Result: subscription extended by 6 months
```

### 3. Test Trial Termination
```bash
# User on trial
# Make payment
# Verify isOnTrial = 0 in database
```

### 4. Run Full Test Suite
```bash
npm test tests/bcl-webhook.test.ts
```

---

## 🚀 Deployment Checklist

### 1. Database Migration
```bash
# Apply schema changes
node migrations/add-subscription-idempotency.js

# Verify constraints
psql $DATABASE_URL -c "
  SELECT conname FROM pg_constraint 
  WHERE conname = 'unique_external_transaction_id';
"
```

### 2. Environment Variables
```bash
# Required
BCL_WEBHOOK_SECRET=<your-secret>
DATABASE_URL=<neon-postgres-url>
SESSION_SECRET=<64-byte-hex>

# Optional (dev/test)
BCL_DEBUG_LOG=1  # Enable detailed payload logging
```

### 3. Verify Deployment
```bash
# 1. Check webhook endpoint
curl https://your-domain.com/api/webhooks/bcl -X POST

# 2. Test in BCL.my sandbox (if available)

# 3. Monitor logs for first real payment
tail -f logs/production.log | grep "\[BCL\]"
```

### 4. Configure BCL.my
```
Webhook URL: https://your-domain.com/api/webhooks/bcl
Webhook Secret: <BCL_WEBHOOK_SECRET>
Events: payment-success, payment-failed
```

---

## 📊 Monitoring & Logs

### Success Log Pattern
```
[BCL] Webhook received: { event: 'payment-success', email: 'user@example.com', amount: 79 }
[BCL] ✓ Signature verified
[BCL] ✓ Payment confirmed as successful
[BCL] ✓ Package identified: { slug: '3-bulan', months: 3, price: 79 }
[BCL] Activating subscription via service layer...
[BCL] ✓ Subscription activation result: { 
  isNewSubscription: true, 
  wasOnTrial: true,
  extendedMonths: 3
}
```

### Idempotent Response Log
```
[BCL] Transaction already processed (idempotent response)
```

### Error Patterns to Watch
```
[BCL] Invalid webhook signature
[BCL] Invalid currency: USD
[BCL] Amount mismatch: expected RM79, got RM50
[BCL] User not found with email: unknown@example.com
```

---

## 🔧 Troubleshooting

### Issue: Duplicate Subscriptions
**Cause**: Migration not applied (unique constraint missing)  
**Fix**: Run migration script
```bash
node migrations/add-subscription-idempotency.js
```

### Issue: Amount Mismatch Error
**Cause**: BCL sends amount with fees deducted  
**Fix**: Update package config with exact BCL amount
```typescript
// In subscription-service.ts
"3-bulan": { months: 3, price: 78.50 }, // Adjusted for fees
```

### Issue: Signature Verification Failed
**Cause**: Wrong BCL_WEBHOOK_SECRET  
**Fix**: Get correct secret from BCL.my dashboard
```bash
# Update .env
BCL_WEBHOOK_SECRET=<correct-secret>
```

### Issue: Trial Not Terminated
**Cause**: Old webhook code path  
**Fix**: Ensure using subscription-service.ts
```typescript
// In bcl-webhook.ts
import { activateSubscription } from "./subscription-service";
const result = await activateSubscription({ ... });
```

---

## 📈 Future Enhancements

- [ ] Refund handling (webhook event)
- [ ] Partial payment support
- [ ] Proration for mid-cycle upgrades
- [ ] Multi-currency support
- [ ] Webhook replay UI (admin)
- [ ] Email notifications (payment success/failed)
- [ ] SMS notifications
- [ ] Auto-renewal reminders (7 days before expiry)

---

## 📚 Related Files

### Backend
- `server/subscription-service.ts` - Core business logic
- `server/bcl-webhook.ts` - Webhook handler
- `server/feature-gating.ts` - Plan limits
- `shared/schema.ts` - Database schema

### Frontend
- `client/src/pages/subscription.tsx` - UI

### Tests
- `tests/bcl-webhook.test.ts` - Webhook tests

### Migrations
- `migrations/add-subscription-idempotency.js` - Schema updates

### Documentation
- `BCL_PAYMENT_FORMS_SETUP.md` - BCL.my setup guide
- `PAYMENT_CLAIMS_IMPLEMENTATION.md` - Old implementation reference

---

## ✅ Summary of Improvements

| Aspect | Before | After |
|--------|--------|-------|
| **Idempotency** | ❌ None | ✅ Unique constraint |
| **Amount Validation** | ⚠️ ±RM2 tolerance | ✅ Exact match |
| **Event Filtering** | ⚠️ Accepts form-submit | ✅ Only payment-success |
| **Trial Termination** | ❌ Manual | ✅ Automatic |
| **Subscription Extension** | ❌ Creates duplicate | ✅ Extends existing |
| **Billing Audit** | ❌ None | ✅ Full history |
| **Signature** | ⚠️ Optional | ✅ Required in prod |
| **Currency Check** | ❌ None | ✅ MYR only |
| **Response Detail** | ⚠️ Basic | ✅ Enhanced |
| **Tests** | ❌ None | ✅ Comprehensive |

---

**Documented by**: GitHub Copilot  
**Reviewed by**: Development Team  
**Approved for Production**: ✅ Ready
