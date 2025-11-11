# BCL.my + Bayarcash Integration - COMPLETE ✅

## 🎉 What's Done

### 1. Payment Forms Setup
✅ All 9 BCL.my forms mapped:
- **BASIC**: 3/6/12 bulan (RM117, RM210.60, RM374.40)
- **PRO**: 3/6/12 bulan (RM267, RM480.60, RM854.40)  
- **PREMIUM**: 3/6/12 bulan (RM477, RM858.60, RM1,526.40)

### 2. Code Integration
✅ `server/bcl-webhook.ts` - Webhook handler created
✅ `client/src/pages/pricing.tsx` - Updated to use BCL.my forms
✅ `server/cron.ts` - Webhook endpoint registered
✅ `shared/schema.ts` - Added payment provider tracking

### 3. Payment Flow
```
User clicks "Bayar Sekarang" in PocketBizz
    ↓
Redirects to BCL.my form (email pre-filled)
    ↓
User pays via Bayarcash (FPX/Card/E-wallet)
    ↓
BCL.my sends webhook to PocketBizz
    ↓
PocketBizz auto-activates subscription ✅
    ↓
User can login & use features immediately
```

---

## 🔧 Next Steps (ACTION REQUIRED)

### Step 1: Setup Webhook in BCL.my Dashboard

For **EACH** of the 9 forms, configure webhook:

**Webhook URL:**
```
https://pocketbizz-production-f02a.up.railway.app/api/webhooks/bcl
```

**Event to subscribe:**
- ✅ `form-submit`

**How to setup:**
1. Login to https://bcl.my/portal
2. Go to each form settings
3. Find "Webhook" or "Integration" section
4. Add webhook URL above
5. Select `form-submit` event
6. Save

### Step 2: Get BCL.my Webhook Secret

1. In BCL.my dashboard, find "API Settings" or "Webhook Settings"
2. Copy the **Webhook Secret** (used for signature verification)
3. Share with developer to add to Railway

### Step 3: Add Environment Variable to Railway

**Variable Name:** `BCL_WEBHOOK_SECRET`
**Value:** [Your BCL.my webhook secret from Step 2]

**How to add:**
```bash
# Go to Railway dashboard
# https://railway.app/project/[your-project-id]
# → Variables tab
# → Add: BCL_WEBHOOK_SECRET = [secret]
# → Deploy
```

Or developer can run:
```bash
# (This will be done by developer once you provide the secret)
```

---

## 🧪 Testing Checklist

After webhook setup complete:

### Test Payment Flow
- [ ] Click "Bayar Sekarang BASIC 3 Bulan" from pricing page
- [ ] Verify redirect to: `https://bnidigital.bcl.my/form/basic-3-bulan`
- [ ] Check email pre-filled in form
- [ ] Complete payment via Bayarcash sandbox/test mode
- [ ] Check Railway logs for webhook received
- [ ] Verify subscription activated in PocketBizz database
- [ ] Login and confirm access to BASIC plan features

### Test Each Package
- [ ] BASIC 3M - RM117
- [ ] BASIC 6M - RM210.60
- [ ] BASIC 12M - RM374.40
- [ ] PRO 3M - RM267
- [ ] PRO 6M - RM480.60
- [ ] PRO 12M - RM854.40
- [ ] PREMIUM 3M - RM477
- [ ] PREMIUM 6M - RM858.60
- [ ] PREMIUM 12M - RM1,526.40

---

## 📊 Form URLs Reference

```
BASIC:
https://bnidigital.bcl.my/form/basic-3-bulan
https://bnidigital.bcl.my/form/basic-6-bulan
https://bnidigital.bcl.my/form/basic-12-bulan

PRO:
https://bnidigital.bcl.my/form/pro-3-bulan
https://bnidigital.bcl.my/form/pro-6-bulan
https://bnidigital.bcl.my/form/pro-12-bulan

PREMIUM:
https://bnidigital.bcl.my/form/premium-3-bulan
https://bnidigital.bcl.my/form/premium-6-bulan
https://bnidigital.bcl.my/form/premium-12-bulan
```

---

## 🔐 Security Features

✅ **Webhook Signature Verification** - Prevents unauthorized activation
✅ **Email Matching** - Webhook must match existing user email
✅ **Payment Amount Validation** - Verifies correct amount paid
✅ **Transaction ID Tracking** - Prevents duplicate activations

---

## 📝 What Happens on Payment Success

1. **User Found** - Matches email from webhook with PocketBizz user
2. **Subscription Created** - New record in `user_subscriptions` table
3. **Trial Cleared** - User's trial/grace period removed
4. **Plan Limits Applied** - Products/stock/transaction limits enforced
5. **Access Granted** - User can immediately use purchased features

---

## 🚨 Troubleshooting

### Webhook not received?
- Check BCL.my form webhook configuration
- Verify webhook URL is correct
- Check Railway deployment logs
- Ensure BCL_WEBHOOK_SECRET is set

### Subscription not activated?
- Check Railway logs for errors
- Verify user registered with same email
- Check payment status in BCL.my dashboard
- Verify form slug matches configuration

### Form shows 404?
- Verify BCL.my forms are published (not draft)
- Check form URLs are accessible
- Confirm subdomain: `bnidigital.bcl.my`

---

## 📞 Support

**For BCL.my Issues:**
- BCL.my support: https://bcl.my/support
- Webhook docs: https://docs.bcl.my/

**For PocketBizz Issues:**
- Check Railway logs: https://railway.app/project/[id]/logs
- Review webhook payload in logs
- Test webhook endpoint: `POST /api/webhooks/bcl`

---

## ✅ Deployment Status

- ✅ Code committed to GitHub
- ✅ Automatically deployed to Railway
- ✅ Pricing page updated (live)
- ⏳ **PENDING**: BCL.my webhook configuration
- ⏳ **PENDING**: BCL_WEBHOOK_SECRET environment variable
- ⏳ **PENDING**: End-to-end payment testing

---

**Ready to test once:**
1. Webhook URLs configured in all 9 BCL.my forms
2. BCL_WEBHOOK_SECRET added to Railway
3. Railway deployment complete (auto-triggered)

Let's go! 🚀
