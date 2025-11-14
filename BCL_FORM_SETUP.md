# BCL.my Form Setup Guide - PocketBizz

## Overview
PocketBizz menggunakan BCL.my untuk payment processing dengan 4 form berbeza untuk setiap duration (1, 3, 6, 12 bulan).

## Form URLs
1. **1 Bulan** - https://bnidigital.bcl.my/form/1-bulan (RM27)
2. **3 Bulan** - https://bnidigital.bcl.my/form/3-bulan (RM79)
3. **6 Bulan** - https://bnidigital.bcl.my/form/6-bulan (RM146)
4. **12 Bulan** - https://bnidigital.bcl.my/form/12-bulan (RM259)

## Required Form Fields
Setiap form MESTI ada custom fields berikut (set sebagai hidden fields):

### 1. Email Field
- **Field Type:** Email
- **Field Slug:** `email`
- **Required:** Yes
- **Purpose:** User identification (fallback jika user_id tak jumpa)

### 2. User ID Field
- **Field Type:** Text
- **Field Slug:** `user_id`
- **Required:** Yes
- **Purpose:** Primary user identification (UUID format)

### 3. Name Field
- **Field Type:** Text
- **Field Slug:** `name`
- **Required:** No
- **Purpose:** Display name untuk receipt

### 4. Package Field
- **Field Type:** Text/Hidden
- **Field Slug:** `package`
- **Default Value:** `standard`
- **Required:** Yes
- **Purpose:** Plan identification (selalu "standard" untuk PocketBizz)

### 5. Duration Field
- **Field Type:** Text/Hidden
- **Field Slug:** `duration`
- **Default Value:** (set mengikut form - "1", "3", "6", atau "12")
- **Required:** Yes
- **Purpose:** Duration verification

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

### Webhook Headers
BCL.my akan send:
- `x-bcl-signature` - HMAC SHA256 signature untuk verification

## Form Pre-fill Flow

Bila user click button dalam `/subscription` page, PocketBizz akan redirect ke BCL form dengan URL params:

```
https://bnidigital.bcl.my/form/3-bulan?email=user@example.com&user_id=uuid-here&name=Ahmad&package=standard&duration=3
```

**Important:** BCL form perlu configure untuk accept dan map URL parameters ni ke hidden fields.

## Payment Flow

1. User click duration button (1/3/6/12 bulan) dalam `/subscription` page
2. Frontend redirect ke BCL form dengan prefilled params
3. User complete payment
4. BCL send webhook ke `/api/webhooks/bcl`
5. Backend:
   - Verify signature
   - Lookup user (try `user_id` first, fallback to `email`)
   - Create subscription record dalam `userSubscriptions` table
   - Auto-activate user account
6. User dapat access full features immediately

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
  "mainDataKeys": ["id", "form_id", "email", "user_id", "package", "duration"],
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

- [ ] 4 forms created dengan correct slugs (1-bulan, 3-bulan, 6-bulan, 12-bulan)
- [ ] Each form has correct amount (RM27, RM79, RM146, RM259)
- [ ] All 5 custom fields added to each form
- [ ] Fields set as hidden or auto-populate from URL params
- [ ] Webhook URL configured dalam BCL dashboard
- [ ] Webhook secret added to Railway env vars
- [ ] Test payment completed successfully
- [ ] Subscription auto-activated dalam database
- [ ] Debug logging disabled after verification (BCL_DEBUG_LOG=0)

## Troubleshooting

### User not found
- Ensure `user_id` field dalam BCL form matches exact UUID dari PocketBizz
- Check `email` field sebagai fallback
- Verify user exists dalam database sebelum payment

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
