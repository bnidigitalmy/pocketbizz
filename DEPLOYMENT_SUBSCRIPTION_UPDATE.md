# 🚀 Deployment Guide: Subscription System Update

**Date**: November 15, 2025  
**Status**: ✅ Ready for Production

---

## 📋 Summary of Changes

Sistem langganan telah dipertingkatkan dengan penambahbaikan keselamatan dan keteguhan:

### ✅ Implemented Features
1. **Idempotency** - Webhook ulang tidak cipta langganan berganda
2. **Strict Validation** - Signature wajib, amount exact match, currency check
3. **Trial Termination** - Auto-tamat trial bila first payment
4. **Subscription Extension** - Extend existing bukan cipta baru
5. **Billing Audit Trail** - Rekod penuh semua payment
6. **Enhanced UI** - Paparan extended subscription notice

---

## 🗄️ Database Changes

### Schema Updates Applied ✅
```sql
-- New columns
ALTER TABLE user_subscriptions ADD COLUMN activation_source TEXT DEFAULT 'webhook_bcl';
ALTER TABLE user_subscriptions ADD COLUMN previous_subscription_id VARCHAR;

-- Unique constraint (idempotency)
ALTER TABLE user_subscriptions 
ADD CONSTRAINT unique_external_transaction_id UNIQUE (external_transaction_id);

-- Performance indexes
CREATE INDEX user_subscriptions_user_id_idx ON user_subscriptions(user_id);
CREATE INDEX user_subscriptions_status_idx ON user_subscriptions(status);
CREATE INDEX user_subscriptions_external_tx_idx ON user_subscriptions(external_transaction_id);
```

**Verification**: Run `npm run db:push` - selesai tanpa error ✅

---

## 📁 Files Modified/Created

### New Files
- `server/subscription-service.ts` - Core subscription logic
- `tests/bcl-webhook.test.ts` - Comprehensive webhook tests
- `migrations/add-subscription-idempotency.js` - Migration script
- `PAYMENT_SUBSCRIPTION_FLOW.md` - Complete documentation

### Modified Files
- `shared/schema.ts` - Added constraints & indexes
- `server/bcl-webhook.ts` - Hardened with strict validation
- `client/src/pages/subscription.tsx` - Enhanced UI with extension notice

---

## 🧪 Testing Checklist

### Pre-Deployment Tests
```bash
# 1. Run test suite
npm test tests/bcl-webhook.test.ts

# 2. Test idempotency manually
curl -X POST http://localhost:5000/api/webhooks/bcl/test \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","months":3,"amount":79}'

# Send again (should return isNewSubscription: false)
```

### Expected Behavior
- ✅ Duplicate webhook returns cached result
- ✅ Trial users get `isOnTrial=0` after payment
- ✅ Second payment extends subscription end date
- ✅ Invalid amount/currency rejected
- ✅ Billing history created for each payment

---

## 🔧 Environment Variables Required

```bash
# Production
BCL_WEBHOOK_SECRET=<your-bcl-secret>
DATABASE_URL=<neon-postgres-url>
SESSION_SECRET=<64-byte-hex>
NODE_ENV=production

# Optional
BCL_DEBUG_LOG=1  # Enable detailed logging (dev only)
```

---

## 🚀 Deployment Steps

### 1. Backup Database (Precaution)
```bash
# Neon auto-backups enabled, but verify
# Check: Neon Dashboard → Backups
```

### 2. Deploy Code
```bash
git add .
git commit -m "feat: harden subscription system with idempotency & strict validation"
git push origin main

# Railway auto-deploys on push
```

### 3. Verify Deployment
```bash
# Check logs for successful start
railway logs

# Test webhook endpoint
curl https://pocketbizz.up.railway.app/api/webhooks/bcl \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"event":"payment-success"}'

# Should return 400 (missing data) - endpoint alive ✅
```

### 4. Configure BCL.my Webhook
```
Login: https://bcl.my/dashboard
Settings → Webhooks
  URL: https://pocketbizz.up.railway.app/api/webhooks/bcl
  Secret: <BCL_WEBHOOK_SECRET>
  Events: payment-success, payment-failed
```

### 5. Monitor First Payment
```bash
# Watch logs for first real payment
railway logs --follow | grep "\[BCL\]"

# Expected log pattern:
# [BCL] Webhook received: { event: 'payment-success', ... }
# [BCL] ✓ Signature verified
# [BCL] ✓ Payment confirmed
# [BCL] ✓ Package identified
# [BCL] ✓ Subscription activation result
```

---

## 🔍 Rollback Plan (If Needed)

### Quick Rollback
```bash
# Revert to previous commit
git revert HEAD
git push origin main

# Or rollback on Railway
railway rollback
```

### Database Rollback
```sql
-- Remove constraints (only if critical issue)
ALTER TABLE user_subscriptions DROP CONSTRAINT unique_external_transaction_id;
DROP INDEX user_subscriptions_user_id_idx;
DROP INDEX user_subscriptions_status_idx;
DROP INDEX user_subscriptions_external_tx_idx;
ALTER TABLE user_subscriptions DROP COLUMN activation_source;
ALTER TABLE user_subscriptions DROP COLUMN previous_subscription_id;
```

**Note**: Rollback tidak disyorkan selepas payment pertama berjaya.

---

## 📊 Monitoring & Alerts

### Key Metrics to Watch
1. **Webhook Success Rate** - Should be >99%
2. **Duplicate Transactions** - Should trigger idempotent response
3. **Trial Termination Rate** - Should match first-payment count
4. **Extension vs New** - Track ratio

### Log Patterns
**Success**:
```
[BCL] ✓ Subscription activation result: { isNewSubscription: true, wasOnTrial: true }
```

**Idempotent**:
```
[BCL] Transaction already processed (idempotent response)
```

**Error** (needs attention):
```
[BCL] Amount mismatch: expected RM79, got RM50
[BCL] User not found with email: unknown@example.com
[BCL] Invalid webhook signature
```

---

## 🎯 Post-Deployment Validation

### Day 1 Checklist
- [ ] First payment processed successfully
- [ ] Trial user converted (isOnTrial=0 verified)
- [ ] Billing history record created
- [ ] No duplicate subscriptions
- [ ] Frontend shows correct end date

### Week 1 Checklist
- [ ] All payments successful (no failures)
- [ ] Extensions working (existing users renew)
- [ ] No idempotency issues
- [ ] User feedback positive

---

## 📞 Support & Troubleshooting

### Common Issues

**Issue**: "Amount mismatch" errors  
**Cause**: BCL deducts fees  
**Fix**: Update SUBSCRIPTION_PACKAGES prices in `subscription-service.ts`

**Issue**: "User not found"  
**Cause**: Email mismatch antara BCL form vs registration  
**Fix**: Advise user to use exact same email

**Issue**: Signature verification failed  
**Cause**: Wrong BCL_WEBHOOK_SECRET  
**Fix**: Verify secret from BCL dashboard

**Issue**: Duplicate subscriptions still appearing  
**Cause**: Constraint not applied  
**Fix**: Re-run `npm run db:push`

---

## ✅ Success Criteria

Deployment considered successful when:
- ✅ Schema changes applied (verified via `\d user_subscriptions` in psql)
- ✅ First test payment creates subscription
- ✅ Duplicate webhook returns idempotent response
- ✅ Trial terminated after payment
- ✅ Billing history logged
- ✅ No errors in production logs
- ✅ User can see updated subscription in UI

---

## 📚 Documentation

- Full Flow: `PAYMENT_SUBSCRIPTION_FLOW.md`
- Testing Guide: `tests/bcl-webhook.test.ts`
- Migration Script: `migrations/add-subscription-idempotency.js`
- BCL Setup: `BCL_PAYMENT_FORMS_SETUP.md`

---

**Deployment Lead**: Development Team  
**Approved By**: Product Owner  
**Deployment Window**: Anytime (backward compatible)  
**Risk Level**: 🟢 Low (backward compatible, safe rollback)

---

🎉 **Ready for Production Deployment**
