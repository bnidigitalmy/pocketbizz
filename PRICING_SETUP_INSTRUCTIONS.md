# 🔧 CARA NAK RUN PRICING SEED DATA

## Masalah Sekarang
- ❌ Pricing page TAKDE HARGA (database subscription_plans table kosong)
- ❌ Screenshot kau tunjuk "Pilih Pakej Yang Sesuai" tapi harga semua blank

## Solution: Run SQL Seed File on Neon Console

### Step 1: Login ke Neon Console
1. Go to https://console.neon.tech
2. Login dengan account kau (email/password atau GitHub)
3. Pilih project **PocketBizz** (atau nama project database kita)

### Step 2: Open SQL Editor
1. Dalam project dashboard, click **"SQL Editor"** di sidebar kiri
2. Atau click button **"Query"** kat atas page
3. SQL editor akan terbuka

### Step 3: Copy & Paste SQL Seed File
1. Open file: `migrations/seed-subscription-plans.sql`
2. Copy **SEMUA** content (Ctrl+A, Ctrl+C)
3. Paste dalam Railway query console
4. Click **"Run Query"** button

### Step 4: Verify Data Inserted

Run query ni untuk check:

```sql
SELECT 
  name,
  display_name,
  monthly_price,
  max_users,
  max_products,
  is_active
FROM subscription_plans
ORDER BY sort_order;
```

Patutnya nampak 3 plans:

- Basic: RM49.00, 1 user, 50 products
- Pro: RM99.00, 3 users, 200 products
- Premium: RM199.00, unlimited

### Step 5: Refresh Pricing Page

- Go to your production URL: `https://pocketbizz-production.up.railway.app/pricing`
- Hard refresh (Ctrl + F5)
- Harga semua patutnya keluar sekarang! ✅

**Neon Database Details:**

```
Host: ep-morning-thunder-a1qym7wn-pooler.ap-southeast-1.aws.neon.tech
Database: neondb
Region: Singapore (ap-southeast-1)
```

---

## 💰 Pricing Summary (What We Seeded)

### Basic - RM49/bulan
- **Target**: Peniaga solo baru start
- **Limits**: 50 products, 1 user
- **Features**:
  - Pengurusan stok asas
  - Rekod jualan & penghantaran
  - Laporan kewangan mudah
  - Thermal invoice printing
  - Export to Excel

### Pro - RM99/bulan ⭐ **PALING POPULAR**
- **Target**: Perniagaan berkembang
- **Limits**: 200 products, 3 users
- **Features**:
  - Semua ciri Basic
  - Vendor & komisyen tracking
  - Expired/rosak item tracking
  - Thermal invoice + QR payment
  - WhatsApp share invoice
  - Priority support

### Premium - RM199/bulan 👑
- **Target**: Perniagaan besar
- **Limits**: UNLIMITED products & users
- **Features**:
  - Semua ciri Pro
  - Custom reports
  - Advanced forecasting
  - Batch/lot tracking (FIFO)
  - Reseller management
  - Custom branding
  - Dedicated support

---

## 🎯 Discount Structure

### Duration Discounts
- **3 bulan**: No discount (standard price)
- **6 bulan**: **10% OFF** total
- **12 bulan**: **20% OFF** total

### Early Bird Special
- **70% OFF** untuk 100 pengguna pertama
- Slot tracker shows: "X/100 remaining"

### Price Examples (with all discounts):

**Pro Plan (Most Popular):**
- 3 months: RM99 x 3 = RM297
- 6 months: RM99 x 6 x 90% = RM534.60 (save RM59.40)
- 12 months: RM99 x 12 x 80% = RM950.40 (save RM237.60)

**With Early Bird (70% off):**
- 3 months: RM297 x 30% = **RM89.10** (save RM207.90!)
- 6 months: RM534.60 x 30% = **RM160.38** (save RM433.62!)
- 12 months: RM950.40 x 30% = **RM285.12** (save RM902.88!) 🔥

---

## ✅ Features Comparison - ACTUAL vs PLANNED

### ✅ Features IMPLEMENTED (shown in pricing):
- Pengurusan stok & inventori
- Jualan & penghantaran
- Laporan kewangan
- Vendor & komisyen tracking
- Thermal invoice printing (80mm)
- QR code payment (DuitNow)
- WhatsApp share invoice
- Expired/rosak item tracking
- Multi-user access
- Export to Excel/PDF

### ❌ Features REMOVED from pricing (not implemented yet):
- ~Google Drive auto-sync~ (future)
- ~Full WhatsApp API integration~ (future)
- ~API access~ (future)
- ~Batch FIFO tracking~ (future)

**Why removed?** 
Pricing page sekarang hanya show features yang ACTUALLY ada dalam app. No false advertising. Honest marketing. 💯

---

## 📝 Notes for You

1. **Must run seed SQL** - Frontend dah siap, cuma database je takde data
2. **Test after seeding** - Open /pricing page, should see all 3 plans with prices
3. **Early bird tracking** - Currently shows "100/100" (need to decrement when user subscribes)
4. **Checkout flow** - Dah ready, just need Stripe/Senangpay integration

Bila dah run SQL seed tu, pricing page akan jadi fully functional! 🚀
