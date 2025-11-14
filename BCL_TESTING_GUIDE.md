# BCL Payment Testing Guide - PocketBizz

## Pre-Test Setup

### 1. Enable Debug Logging
Login to Railway dashboard dan set environment variable:
```bash
BCL_WEBHOOK_SECRET=<your-secret>
BCL_DEBUG_LOG=1
```
Lepas tu redeploy service.

### 2. Verify BCL Forms Setup
Pastikan semua 4 forms dah setup dengan betul:
- ✅ https://bnidigital.bcl.my/form/1-bulan (RM27)
- ✅ https://bnidigital.bcl.my/form/3-bulan (RM79)
- ✅ https://bnidigital.bcl.my/form/6-bulan (RM146)
- ✅ https://bnidigital.bcl.my/form/12-bulan (RM259)

Each form MESTI ada 5 custom fields:
- `email` (email type, required)
- `user_id` (text/hidden, required)
- `name` (text, optional)
- `package` (hidden, default: "standard")
- `duration` (hidden, default: "1", "3", "6", or "12")

## Testing Steps

### Step 1: Create Test User Account
1. Buka production site: https://your-domain.com
2. Register new account atau login existing test account
3. Catat email dan user ID (boleh check dalam browser DevTools → Application → Cookies → check session)

### Step 2: Access Subscription Page
1. Login sebagai test user
2. Navigate ke `/subscription` page
3. Pastikan trial status visible

### Step 3: Initiate Payment (Choose Duration)
**Option A: Test 1-Month Payment**
```
1. Click button "1 Bulan - RM27"
2. Verify redirect ke: https://bnidigital.bcl.my/form/1-bulan?email=...&user_id=...&name=...&package=standard&duration=1
3. Check URL parameters ada semua required fields
```

**Option B: Test 3-Month Payment (Recommended)**
```
1. Click button "3 Bulan - RM79"
2. Verify redirect ke: https://bnidigital.bcl.my/form/3-bulan?email=...&user_id=...&name=...&package=standard&duration=3
```

### Step 4: Complete BCL Payment Form
1. Verify semua fields pre-filled dari URL params
2. Check amount displayed: RM79 (for 3-month)
3. Select payment method (FPX/Credit Card/E-Wallet)
4. Complete payment process
5. **Important:** Use real payment untuk test production webhook (or use BCL test mode jika available)

### Step 5: Monitor Webhook Logs
Open Railway logs dalam real-time:
```bash
railway logs --tail
```

Look for these log entries:
```
[BCL] Webhook received: { event: 'form-submit', formId: ..., email: '...', recordId: '...' }
[BCL] Payload snapshot: { formSlug: '3-bulan', paymentStatus: 'paid', amount: 79, currency: 'MYR', ... }
[BCL] Matched form slug: 3-bulan
[BCL] Looking up user by ID: <uuid>
[BCL] User found by ID: <uuid> <email>
[BCL] Subscription created: <subscription-id>
[BCL] User subscription activated successfully
```

### Step 6: Verify Database
Run database verification:
```bash
node verify-db.js
```

Check for new subscription:
```sql
SELECT 
  us.id,
  us."userId",
  us."planName",
  us."durationMonths",
  us."subscriptionStartsAt",
  us."subscriptionEndsAt",
  us."totalPaid",
  us."paymentProvider",
  us."externalTransactionId",
  us.status
FROM "userSubscriptions" us
WHERE us."userId" = '<test-user-id>'
ORDER BY us."createdAt" DESC
LIMIT 1;
```

Expected result:
```json
{
  "id": "...",
  "userId": "<test-user-id>",
  "planName": "PocketBizz",
  "durationMonths": 3,
  "subscriptionStartsAt": "2025-11-14T...",
  "subscriptionEndsAt": "2026-02-14T...",
  "totalPaid": "79",
  "paymentProvider": "bcl_bayarcash",
  "externalTransactionId": "LINK-XXXXX",
  "status": "active"
}
```

### Step 7: Verify User Access
1. Refresh `/subscription` page
2. Check "Current Plan Card" shows:
   - ✅ Badge: "Active"
   - ✅ Plan: "PocketBizz"
   - ✅ Duration: "3 months"
   - ✅ Progress bar showing days remaining
   - ✅ Subscription end date
3. Navigate to other pages - verify full access (no trial limitations)

### Step 8: Check Billing Information
Dalam `/subscription` page, scroll ke "Billing Information" card:
- ✅ Payment Provider: "bcl bayarcash"
- ✅ Transaction ID: "LINK-XXXXX"
- ✅ Amount Paid: "RM 79"

## Post-Test Cleanup

### Disable Debug Logging
Dalam Railway environment variables:
```bash
BCL_DEBUG_LOG=0
# or remove the variable entirely
```
Redeploy service.

## Common Issues & Solutions

### ❌ Webhook tidak trigger
**Symptom:** No log entries dalam Railway after payment
**Solutions:**
1. Check BCL dashboard → Webhooks → verify URL configured
2. Ensure webhook enabled untuk "form-submit" dan "payment-success" events
3. Check Railway service is running (not crashed)

### ❌ User not found error
**Symptom:** Log shows "User not found - userId: ..., email: ..."
**Solutions:**
1. Verify `user_id` field dalam BCL form matches exact UUID
2. Check user exists: `SELECT * FROM users WHERE id = '<uuid>'`
3. Ensure email fallback is correct
4. Check URL params ada pass correctly ke BCL form

### ❌ Signature verification failed
**Symptom:** Log shows "Invalid webhook signature"
**Solutions:**
1. Check `BCL_WEBHOOK_SECRET` dalam Railway env vars
2. Verify secret matches BCL dashboard setting exactly
3. Temporarily disable signature check untuk test (not recommended for production)

### ❌ Plan not found error
**Symptom:** Log shows "Plan not found: standard"
**Solutions:**
1. Run seed script: `node server/seed-plans.ts`
2. Verify plan exists: `SELECT * FROM "subscriptionPlans" WHERE name = 'standard'`

### ❌ Wrong subscription duration
**Symptom:** 3-month payment creates 6-month subscription
**Solutions:**
1. Check BCL form's `duration` field default value
2. Verify `form_slug` dalam webhook payload matches config
3. Enable debug log untuk see exact payload

### ❌ Subscription created but not active
**Symptom:** Database record exists but user still on trial
**Solutions:**
1. Check subscription `status` field = "active"
2. Verify `subscriptionEndsAt` is in the future
3. Clear cache: user might need to logout/login
4. Check feature-gating.ts logic

## Success Criteria

Test dianggap berjaya jika:
- ✅ Webhook received and logged
- ✅ User matched correctly (by user_id or email)
- ✅ Subscription record created dalam database
- ✅ Subscription status = "active"
- ✅ Correct duration (1/3/6/12 months)
- ✅ Correct amount paid (RM27/79/146/259)
- ✅ Transaction ID from BCL stored
- ✅ User interface shows active subscription
- ✅ User has full access to all features

## Next Steps After Successful Test

1. **Disable Debug Logging** - Set `BCL_DEBUG_LOG=0`
2. **Test Other Durations** - Verify 1, 6, and 12-month flows
3. **Test Failed Payment** - Verify error handling
4. **Setup Email Notifications** - Welcome email after activation
5. **Monitor Production** - Watch logs for first real customer payments
6. **Setup Analytics** - Track conversion rates and popular durations
7. **Configure Redis** - For 5k users scale (set `REDIS_URL`)

## Test Checklist

Pre-test:
- [ ] BCL_DEBUG_LOG=1 enabled
- [ ] BCL forms configured with all fields
- [ ] Webhook URL set dalam BCL dashboard
- [ ] Test user account created

During test:
- [ ] Payment button clicked successfully
- [ ] BCL form prefilled correctly
- [ ] Payment completed
- [ ] Railway logs show webhook received
- [ ] No errors dalam logs

Post-test verification:
- [ ] Database has new subscription record
- [ ] Subscription status = "active"
- [ ] Correct duration and amount
- [ ] User UI shows active subscription
- [ ] User has full access
- [ ] Debug logging disabled

## Support

Kalau stuck:
1. Check `BCL_FORM_SETUP.md` untuk form configuration
2. Review `server/bcl-webhook.ts` untuk webhook logic
3. Check Railway logs untuk detailed error messages
4. Run `node verify-db.js` untuk database inspection
5. Ask for help dengan copy-paste log snippet (remove sensitive data)
