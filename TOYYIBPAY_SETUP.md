# 🔧 ToyyibPay Setup Guide

## ❌ Current Error
```
ToyyibPay credentials not configured
```

**Why?** Environment variables belum set di Railway.

---

## 📋 Required Environment Variables

Kena add 2 variables ni kat Railway:

### 1. `TOYYIBPAY_USER_SECRET_KEY`
- **Dapatkan dari**: ToyyibPay Dashboard → Settings → User Secret Key
- **Format**: String 32 characters (contoh: `abc123def456...`)
- **Purpose**: Authentication untuk ToyyibPay API

### 2. `TOYYIBPAY_CATEGORY_CODE`
- **Dapatkan dari**: ToyyibPay Dashboard → Bank Settings → Category Code
- **Format**: String (contoh: `abc12345`)
- **Purpose**: Link payment ke category/product dalam ToyyibPay

---

## 🚀 Setup Steps

### Step 1: Login ke ToyyibPay
1. Go to: https://toyyibpay.com
2. Login dengan account kau
3. (Kalau takde account, register dulu - FREE)

### Step 2: Get User Secret Key
1. Dashboard → Click **"Settings"** (gear icon)
2. Scroll down → **"User Secret Key"** section
3. Copy key tu (32 characters alphanumeric)
4. Save somewhere safe (kena ni nanti)

### Step 3: Get Category Code
1. Dashboard → **"Bank Settings"** tab
2. Click **"Add Category"** (kalau belum ada)
3. Fill in:
   - **Category Name**: "PocketBizz Subscription"
   - **Description**: "Monthly subscription plans"
   - **Bank Account**: Pilih bank account untuk terima payment
4. Save → Copy **"Category Code"** (akan dapat after save)

### Step 4: Add Environment Variables to Railway
1. Go to: https://railway.app
2. Open **PocketBizz** project
3. Click **service** (web app deployment)
4. Go to **"Variables"** tab
5. Click **"+ New Variable"**
6. Add first variable:
   ```
   TOYYIBPAY_USER_SECRET_KEY = <paste your secret key>
   ```
7. Click **"+ New Variable"** again
8. Add second variable:
   ```
   TOYYIBPAY_CATEGORY_CODE = <paste your category code>
   ```
9. Click **"Deploy"** (Railway will auto-redeploy with new variables)

### Step 5: Wait for Deployment
- Railway akan auto-redeploy (2-3 minit)
- Check deployment logs untuk confirmation
- Look for: "✓ Build complete" and "✓ Deployment live"

### Step 6: Test Payment Flow
1. Go to pricing page: `https://pocketbizz-production.up.railway.app/pricing`
2. Click **"Pilih Pakej Pro"** (6 months)
3. Login if needed
4. Checkout page → Click **"Teruskan Pembayaran"**
5. **Expected**: Redirect to ToyyibPay payment page ✅
6. **Before Fix**: Error "ToyyibPay credentials not configured" ❌

---

## 🧪 Testing with ToyyibPay Sandbox

Kalau nak test tanpa real payment, guna **Sandbox Mode**:

### Enable Sandbox (Development)
Add variable ni kat Railway (optional):
```
TOYYIBPAY_SANDBOX = true
```

Then change API URL in code:
```typescript
const TOYYIBPAY_API_URL = process.env.TOYYIBPAY_SANDBOX 
  ? 'https://dev.toyyibpay.com/index.php/api'  // Sandbox
  : 'https://toyyibpay.com/index.php/api';     // Production
```

**Sandbox credentials** (for testing):
- Dashboard: https://dev.toyyibpay.com
- Register separate account for sandbox
- Get separate secret key & category code

---

## 📊 Pricing Calculations

With ToyyibPay configured, ni flow calculation:

### Example: Pro Plan - 6 Months
```
Monthly Price: RM99.00
Duration: 6 months
Subtotal: RM99 × 6 = RM594.00

Duration Discount: 10% OFF
After discount: RM594 × 0.90 = RM534.60

Early Bird (first 100 users): 70% OFF
Final Price: RM534.60 × 0.30 = RM160.38

ToyyibPay receives: 16038 cents (RM160.38 × 100)
```

---

## 🔐 Security Best Practices

### ✅ DO:
- Store secret key di Railway environment variables (NEVER in code)
- Use HTTPS for callback URLs
- Verify payment status dengan ToyyibPay API (don't trust frontend)
- Log all payment transactions

### ❌ DON'T:
- Commit secret keys to git
- Expose secret keys dalam frontend code
- Trust payment status from client side only
- Share secret keys publicly

---

## 🐛 Troubleshooting

### Problem: "ToyyibPay credentials not configured"
**Solution**: Add environment variables to Railway (see Step 4 above)

### Problem: "Invalid category code"
**Solution**: 
- Double check category code dari ToyyibPay dashboard
- Make sure category is **ACTIVE** (not disabled)
- Bank account linked properly

### Problem: "Invalid secret key"
**Solution**:
- Copy full secret key (32 characters)
- No extra spaces atau line breaks
- Try regenerate new secret key dari dashboard

### Problem: Payment redirects but "Order not found"
**Solution**:
- Check callback URL configured correctly
- Verify webhook endpoint: `https://your-domain.com/api/payment/callback`
- Enable webhook notifications dalam ToyyibPay settings

### Problem: "Payment successful but subscription not activated"
**Solution**:
- Check server logs untuk webhook errors
- Verify database connection
- Test webhook manually dengan ToyyibPay dashboard

---

## 📞 ToyyibPay Support

**Need help?**
- Email: support@toyyibpay.com
- WhatsApp: +60 12-345 6789 (example - check their website)
- Docs: https://toyyibpay.com/apireference/
- FAQ: https://toyyibpay.com/faq/

**Response time**: Usually 1-2 business days

---

## ✅ Checklist Before Going Live

Production launch checklist:

- [ ] ToyyibPay account verified (submit business documents)
- [ ] Bank account linked and active
- [ ] Secret key & category code configured in Railway
- [ ] Test payment flow end-to-end
- [ ] Webhook callback URL working
- [ ] SSL certificate active (HTTPS)
- [ ] Payment successful email notification working
- [ ] Subscription activation logic tested
- [ ] Refund process documented
- [ ] Customer support ready for payment issues

---

## 💰 ToyyibPay Fees

**Transaction Fees** (as of 2025):
- FPX (Online Banking): 1.5% + RM1.00
- Credit/Debit Card: 2.8% + RM0.50
- E-wallets: 1.5% - 2.0%

**Example for RM160.38 payment (Pro 6 months with early bird):**
- Customer pays: RM160.38
- ToyyibPay fee (FPX): RM160.38 × 1.5% + RM1 = RM3.41
- **You receive: RM156.97**

**Settlement**:
- T+2 days (2 business days after successful payment)
- Direct to bank account
- View settlement report in dashboard

---

## 🎯 Next Steps After Setup

1. **Test payment** dengan dummy transaction
2. **Monitor first 10 payments** closely
3. **Setup refund policy** and process
4. **Configure email notifications** for successful payments
5. **Add payment receipt** generation (PDF)
6. **Setup dashboard** untuk track revenue & active subscriptions

Once environment variables set, system akan fully functional for payments! 🚀
