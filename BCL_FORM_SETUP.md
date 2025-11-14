# BCL.my Form Setup Guide - PocketBizz (SIMPLIFIED)

## Overview
PocketBizz menggunakan BCL.my untuk payment processing dengan 4 form berbeza untuk setiap duration (1, 3, 6, 12 bulan).

**Important:** BCL.my **TIDAK** support hidden fields atau URL parameter persistence. User akan isi email manual dalam form, dan webhook akan match by email untuk activate subscription.

## Form URLs
1. **1 Bulan** - https://bnidigital.bcl.my/form/1-bulan (RM27)
2. **3 Bulan** - https://bnidigital.bcl.my/form/3-bulan (RM79)
3. **6 Bulan** - https://bnidigital.bcl.my/form/6-bulan (RM146)
4. **12 Bulan** - https://bnidigital.bcl.my/form/12-bulan (RM259)

## ✅ Form Fields (Yang Dah Ada - KEEP AS IS)

Setiap form hanya perlu 3 basic fields (yang BCL dah provide by default):

### 1. Email Field
- **Field Type:** Email
- **Required:** Yes ✅
- **Purpose:** User identification (CRITICAL - this is how webhook matches user)
- **User akan isi:** Email yang sama dengan PocketBizz account

### 2. Name Field  
- **Field Type:** Text
- **Required:** Yes ✅
- **Purpose:** Display name untuk receipt

### 3. Mobile Number Field
- **Field Type:** Phone
- **Required:** Yes ✅
- **Purpose:** Contact information

## ❌ TIDAK PERLU Custom Fields

Kau **TIDAK PERLU** tambah field lain:
- ❌ user_id - Customer takkan tahu UUID mereka
- ❌ package - Form slug (1-bulan, 3-bulan, etc.) dah identify package automatically
- ❌ duration - Form slug dah identify duration automatically

## 🔧 Form Configuration Checklist

Untuk setiap 4 forms:

### Form: 1-bulan (RM27)
- [ ] Form title: "Langganan 1 Bulan"
- [ ] Form slug: **MESTI** `1-bulan` (lowercase, no spaces)
- [ ] Amount: RM27.00
- [ ] Fields: Email (required), Name (required), Mobile Number (required)

### Form: 3-bulan (RM79)
- [ ] Form title: "Langganan 3 Bulan"
- [ ] Form slug: **MESTI** `3-bulan` (lowercase, no spaces)
- [ ] Amount: RM79.00
- [ ] Fields: Email (required), Name (required), Mobile Number (required)

### Form: 6-bulan (RM146)
- [ ] Form title: "Langganan 6 Bulan"
- [ ] Form slug: **MESTI** `6-bulan` (lowercase, no spaces)
- [ ] Amount: RM146.00
- [ ] Fields: Email (required), Name (required), Mobile Number (required)

### Form: 12-bulan (RM259)
- [ ] Form title: "Langganan 12 Bulan"
- [ ] Form slug: **MESTI** `12-bulan` (lowercase, no spaces)
- [ ] Amount: RM259.00
- [ ] Fields: Email (required), Name (required), Mobile Number (required)

## Webhook Configuration

### Webhook URL
```
https://your-domain.com/api/webhooks/bcl
```

### Webhook Secret
Set dalam BCL.my dashboard dan tambah dalam Railway environment variables:
```bash
BCL_WEBHOOK_SECRET=your-webhook-secret-here
```

### Webhook Events
Enable these events dalam BCL.my:
- ✅ `form-submit` - Triggered bila form submitted
- ✅ `payment-success` - Triggered bila payment confirmed
- ✅ `payment-failed` - (Optional) For tracking failed payments

### Webhook Events
Enable these events dalam BCL.my:
- ✅ `form-submit` - Triggered bila form submitted
- ✅ `payment-success` - Triggered bila payment confirmed
- ✅ `payment-failed` - (Optional) For tracking failed payments

### Webhook Headers
BCL.my akan send:
- `x-bcl-signature` - HMAC SHA256 signature untuk verification

## 💡 How It Works (Simplified Flow)

### User Journey:
1. User **register di PocketBizz** dengan email (contoh: `ahmad@example.com`)
2. User login → navigate to `/subscription` page
3. User click button "3 Bulan - RM79"
4. Browser redirect ke: `https://bnidigital.bcl.my/form/3-bulan`
5. **User manually isi form BCL:**
   - Email: `ahmad@example.com` ← **MESTI sama dengan PocketBizz account**
   - Name: Ahmad bin Ali
   - Mobile: 012-3456789
6. User complete payment (FPX/Card/E-Wallet)
7. BCL send webhook ke PocketBizz backend
8. Backend:
   - Receive webhook dengan `form_slug: "3-bulan"` dan `email: "ahmad@example.com"`
   - Lookup user dalam database by email
   - Create subscription (3 months, RM79)
   - Auto-activate account
9. User refresh `/subscription` → sees active plan ✅

### Critical Success Factor:
**User MESTI gunakan email yang SAMA** untuk:
- ✅ Register PocketBizz account
- ✅ Isi BCL payment form

Kalau email berbeza → webhook tak jumpa user → payment tak auto-activate.

## Payment Flow

1. User register/login di PocketBizz
2. User click duration button (1/3/6/12 bulan) dalam `/subscription` page
3. Frontend redirect ke BCL form (tanpa params, clean URL)
4. User manually isi email (MESTI sama dengan PocketBizz account), name, phone
5. User complete payment
6. BCL send webhook ke `/api/webhooks/bcl`
7. Backend:
   - Verify signature
   - Extract `form_slug` (e.g., "3-bulan") → identify package & duration
   - Extract `email` from webhook payload
   - Lookup user dalam database by email
   - Create subscription record dalam `userSubscriptions` table
   - Auto-activate user account
8. User refresh page → sees active subscription ✅

## Testing

### Enable Debug Logging
Set dalam Railway environment:
```bash
BCL_DEBUG_LOG=1
```

Ini akan log safe snapshot of webhook payload (tanpa sensitive data):
```json
{
  "formSlug": "3-bulan",
  "paymentStatus": "paid",
  "amount": 79,
  "currency": "MYR",
  "mainDataKeys": ["id", "form_id", "email", "name", "phone"],
  "paymentInfoKeys": ["payment_status", "amount", "currency", "transaction_id"]
}
```

### Test Endpoint (Development Only)
```bash
curl -X POST http://localhost:5000/api/webhooks/bcl/test \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "formId": 999,
    "package": "standard",
    "months": 3,
    "price": 79
  }'
```

## Verification Checklist

- [ ] 4 forms created dengan correct slugs: `1-bulan`, `3-bulan`, `6-bulan`, `12-bulan` (lowercase, exact match)
- [ ] Each form has correct amount (RM27, RM79, RM146, RM259)
- [ ] Each form has 3 basic fields: Email (required), Name (required), Mobile Number (required)
- [ ] Webhook URL configured dalam BCL dashboard: `https://your-domain.com/api/webhooks/bcl`
- [ ] Webhook events enabled: Payment Success, Form Submit
- [ ] Webhook secret added to Railway env vars: `BCL_WEBHOOK_SECRET`
- [ ] Test payment completed successfully
- [ ] User registered dengan email BEFORE payment
- [ ] User isi SAME email dalam BCL form
- [ ] Subscription auto-activated dalam database
- [ ] Debug logging disabled after verification (`BCL_DEBUG_LOG=0`)

## Troubleshooting

### User not found error
**Symptom:** Webhook logs show "User not found with email: xyz@example.com"

**Solutions:**
1. ✅ Verify user exists dalam database: `SELECT * FROM users WHERE email = 'xyz@example.com'`
2. ✅ User MESTI register di PocketBizz SEBELUM buat payment
3. ✅ Email dalam BCL form MESTI exactly sama dengan email registration (check typos, spacing, case)
4. ✅ Email adalah case-insensitive dalam database, tapi better match exactly

### Form slug not matched
**Symptom:** Webhook logs show "Unknown form - formSlug: 3bulan"

**Solutions:**
1. ✅ Check BCL form slug setting - MESTI exact: `1-bulan`, `3-bulan`, `6-bulan`, `12-bulan`
2. ✅ Slug format: lowercase, dengan hyphen (dash)
3. ✅ NO spaces, NO uppercase
4. ✅ BCL form editor → Settings → Form Slug (edit jika salah)

### Webhook signature verification failed
- Double-check `BCL_WEBHOOK_SECRET` dalam Railway env vars
- Ensure secret matches exactly dengan BCL dashboard setting
- Check webhook payload format

### Subscription not activated
- Enable `BCL_DEBUG_LOG=1` untuk tengok full payload
- Check Railway logs untuk error messages
- Verify plan "standard" exists dalam `subscriptionPlans` table

## Support

Untuk issues atau questions:
1. Check Railway logs: `railway logs`
2. Check database: `node verify-db.js`
3. Test webhook manually using test endpoint
