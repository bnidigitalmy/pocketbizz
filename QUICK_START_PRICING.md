# 🚀 QUICK START: Populate Pricing Data (Neon)

## ⚡ 3 Minit Je Settle!

### 1️⃣ Open Neon Console
```
https://console.neon.tech
```
- Login dengan account kau
- Click project **PocketBizz** (or your database project name)

### 2️⃣ Open SQL Editor
- Sidebar kiri → Click **"SQL Editor"**
- Atau toolbar atas → Button **"Query"**

### 3️⃣ Copy SQL File Content
- Open file: `migrations/seed-subscription-plans.sql`
- Select ALL (Ctrl+A)
- Copy (Ctrl+C)

### 4️⃣ Paste & Run
- Paste dalam Neon SQL Editor (Ctrl+V)
- Click **"Run"** button (atau tekan Ctrl+Enter)
- Wait for success message ✅

### 5️⃣ Verify
Run this query:
```sql
SELECT name, display_name, monthly_price, max_products, max_users 
FROM subscription_plans 
ORDER BY sort_order;
```

Should see:
```
basic    | Basic    | 49.00  | 50      | 1
pro      | Pro      | 99.00  | 200     | 3
premium  | Premium  | 199.00 | 999999  | 999999
```

### 6️⃣ Test Pricing Page
Open: `https://pocketbizz-production.up.railway.app/pricing`

**Expected result:**
- ✅ 3 pricing cards with RM49/RM99/RM199
- ✅ Duration tabs (3/6/12 months) working
- ✅ Early bird banner showing "70% OFF"
- ✅ Feature comparison table populated
- ✅ "Pilih Pakej" buttons working

---

## 🐛 Troubleshooting

**Problem: "Table subscription_plans does not exist"**
- Run migrations first: Check Railway deployment logs
- Or manually run migration files in order

**Problem: "Harga masih takde"**
- Check browser console (F12) for errors
- Hard refresh page (Ctrl+Shift+R)
- Check API endpoint: `/api/subscription-plans` returns data

**Problem: "Invalid JSON in features column"**
- SQL seed file has correct JSON format
- Don't modify the JSON strings

---

## 📞 Need Help?
If stuck, check:
1. Neon project is active (not paused)
2. Database connection works (check Railway env vars)
3. Migrations ran successfully
4. API endpoint returns 200 OK

Database details:
```
Host: ep-morning-thunder-a1qym7wn-pooler.ap-southeast-1.aws.neon.tech
Database: neondb
Region: ap-southeast-1 (Singapore)
```
