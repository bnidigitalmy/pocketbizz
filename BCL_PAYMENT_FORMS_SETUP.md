# BCL.my Payment Forms Setup Guide untuk PocketBizz

## 📋 Overview

PocketBizz menggunakan BCL.my payment forms yang terintegrasi dengan Bayarcash untuk pemprosesan pembayaran. Guide ini akan tunjukkan cara setup **9 payment forms** (3 pakej × 3 billing cycles).

---

## 💰 Pricing Structure

### Current Packages & Pricing

| Package | Monthly Price | 3 Bulan | 6 Bulan (10% OFF) | 12 Bulan (20% OFF) |
|---------|---------------|---------|-------------------|-------------------|
| **BASIC** | RM39/bulan | RM117 | RM210.60 | RM374.40 |
| **PRO** | RM89/bulan | RM267 | RM480.60 | RM854.40 |
| **PREMIUM** | RM159/bulan | RM477 | RM858.60 | RM1,526.40 |

### Calculation Details

**3 Bulan** (No discount):
- BASIC: 39 × 3 = RM117
- PRO: 89 × 3 = RM267
- PREMIUM: 159 × 3 = RM477

**6 Bulan** (10% OFF):
- BASIC: (39 × 6) × 0.90 = RM210.60
- PRO: (89 × 6) × 0.90 = RM480.60
- PREMIUM: (159 × 6) × 0.90 = RM858.60

**12 Bulan** (20% OFF):
- BASIC: (39 × 12) × 0.80 = RM374.40
- PRO: (89 × 12) × 0.80 = RM854.40
- PREMIUM: (159 × 12) × 0.80 = RM1,526.40

---

## 🔧 Step-by-Step: Create BCL.my Payment Forms

### 1. Login ke BCL.my Dashboard
- Go to: https://bcl.my/login
- Login dengan credentials kau

### 2. Create New Payment Form

Untuk **SETIAP** kombinasi package + billing cycle, buat form baru:

#### Form Configuration Template

**Nama Form**: `PocketBizz - [PACKAGE] [DURATION]`

Contoh:
- `PocketBizz - BASIC 3 Bulan`
- `PocketBizz - PRO 6 Bulan`
- `PocketBizz - PREMIUM 12 Bulan`

#### Form Fields Setup

**Required Fields:**
1. **Name** (text input)
   - Label: "Nama Penuh"
   - Required: Yes
   
2. **Email** (email input)
   - Label: "Email"
   - Required: Yes
   - **Important**: This will be auto-filled from PocketBizz
   
3. **Phone** (phone input)
   - Label: "No. Telefon"
   - Required: Yes

4. **Hidden Field - User ID** (hidden) ⭐ **CRITICAL**
   - Field name: `user_id`
   - Value: Will be passed from PocketBizz URL
   - **This ensures exact user matching**

5. **Hidden Field - Package** (hidden)
   - Field name: `package`
   - Value: `basic` / `pro` / `premium`
   
6. **Hidden Field - Duration** (hidden)
   - Field name: `duration`
   - Value: `3` / `6` / `12`

**⚠️ Important:** BCL.my forms should accept URL parameters to auto-fill these hidden fields.

#### Payment Settings

- **Amount**: Fixed amount (refer pricing table above)
- **Payment Methods**: Enable all (FPX, Card, E-wallet via Bayarcash)
- **Currency**: MYR
- **Success Message**: "Terima kasih! Akaun PocketBizz anda akan diaktifkan dalam beberapa minit."

#### Webhook Configuration

**Webhook URL**: 
```
https://pocketbizz-production-f02a.up.railway.app/api/webhooks/bcl
```

**Events to subscribe**:
- ✅ `form-submit` (when payment success)

**Webhook Secret**: 
```
[KAU PERLU BAGI BCL_WEBHOOK_SECRET DARI BCL.MY DASHBOARD]
```

---

## 📝 Forms Checklist

Kau perlu create **9 forms** total:

### BASIC Package Forms
- [ ] **Form 1**: BASIC 3 Bulan - RM117.00
- [ ] **Form 2**: BASIC 6 Bulan - RM210.60 (10% OFF)
- [ ] **Form 3**: BASIC 12 Bulan - RM374.40 (20% OFF)

### PRO Package Forms
- [ ] **Form 4**: PRO 3 Bulan - RM267.00
- [ ] **Form 5**: PRO 6 Bulan - RM480.60 (10% OFF)
- [ ] **Form 6**: PRO 12 Bulan - RM854.40 (20% OFF)

### PREMIUM Package Forms
- [ ] **Form 7**: PREMIUM 3 Bulan - RM477.00
- [ ] **Form 8**: PREMIUM 6 Bulan - RM858.60 (10% OFF)
- [ ] **Form 9**: PREMIUM 12 Bulan - RM1,526.40 (20% OFF)

---

## 🔗 After Creating Forms

### Step 1: Get Form IDs & URLs

Selepas create semua forms, kumpulkan maklumat ni:

```
BASIC 3M:
- Form ID: _____
- Form URL: https://bcl.my/______

BASIC 6M:
- Form ID: _____
- Form URL: https://bcl.my/______

BASIC 12M:
- Form ID: _____
- Form URL: https://bcl.my/______

PRO 3M:
- Form ID: _____
- Form URL: https://bcl.my/______

PRO 6M:
- Form ID: _____
- Form URL: https://bcl.my/______

PRO 12M:
- Form ID: _____
- Form URL: https://bcl.my/______

PREMIUM 3M:
- Form ID: _____
- Form URL: https://bcl.my/______

PREMIUM 6M:
- Form ID: _____
- Form URL: https://bcl.my/______

PREMIUM 12M:
- Form ID: _____
- Form URL: https://bcl.my/______
```

### Step 2: Update PocketBizz Config

Bila kau dah dapat **Form IDs**, bagi aku:
1. All 9 Form IDs
2. BCL.my Webhook Secret
3. Confirm semua forms dah setup webhook ke `https://pocketbizz-production-f02a.up.railway.app/api/webhooks/bcl`

Aku akan update:
- `server/bcl-webhook.ts` - Form ID mapping
- `client/src/pages/pricing.tsx` - Payment buttons link ke BCL.my forms
- Railway environment variables - BCL_WEBHOOK_SECRET

---

## 🎯 Payment Flow

```
User click "Bayar Sekarang BASIC 3 Bulan" in PocketBizz
    ↓
PocketBizz passes user data via URL:
  - email (pre-filled)
  - user_id (hidden field) ⭐
  - name (pre-filled)
  - package (hidden)
  - duration (hidden)
    ↓
Redirect to BCL.my form with pre-filled data
    ↓
User bayar via Bayarcash (FPX/Card/E-wallet)
    ↓
BCL.my trigger webhook → PocketBizz with user_id
    ↓
PocketBizz matches user by ID (exact match!)
    ↓
Auto-activate subscription ✅
    ↓
User dapat email confirmation + akaun active
```

**Key Improvement:** Using `user_id` ensures 100% accurate user matching, even if:
- User changes email
- Email typo in payment form
- Different email used for payment

---

## 🧪 Testing Checklist

Selepas setup, test setiap form:

- [ ] Form loads correctly
- [ ] Email auto-populated (if user logged in)
- [ ] Payment gateway active (Bayarcash)
- [ ] Webhook triggered after payment
- [ ] Subscription activated in PocketBizz
- [ ] User can login & access features based on package limits

---

## 🔐 Security Notes

**Webhook Verification**:
- BCL.my akan send signature header
- PocketBizz verify signature sebelum activate subscription
- Prevent unauthorized activation attempts

**Environment Variables Required**:
```bash
BCL_WEBHOOK_SECRET=your_bcl_webhook_secret_here
```

---

## 📞 Next Steps

1. **Create all 9 forms** dalam BCL.my dashboard
2. **Collect Form IDs & URLs** 
3. **Get Webhook Secret** from BCL.my
4. **Share dengan aku** - Form IDs mapping
5. **Aku update code** - Integration complete
6. **Test payment flow** - End-to-end testing

---

## ❓ Questions?

Bila setup forms:
- Screenshot error kalau ada issue
- Share form URL untuk aku test
- Confirm webhook setup betul

**Form creation estimate time**: 30-45 minutes untuk semua 9 forms

Let's do this! 🚀
