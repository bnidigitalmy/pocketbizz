# How to Update Trial Plan in Production

## Option 1: Via Railway Dashboard (EASIEST) ⭐

1. **Login to Railway**
   - Go to https://railway.app
   - Login with your account

2. **Select Database**
   - Click on your `pocketbizz-production` project
   - Click on the **PostgreSQL** service

3. **Open Query Tab**
   - Click on **"Query"** tab (or **"Data"** tab)
   - You'll see a SQL query interface

4. **Run the SQL**
   ```sql
   UPDATE subscription_plans 
   SET is_active = 0, display_name = 'Free Trial' 
   WHERE name = 'trial';
   ```

5. **Verify**
   ```sql
   SELECT name, display_name, is_active 
   FROM subscription_plans 
   ORDER BY sort_order;
   ```

---

## Option 2: Via psql Command Line

If you have `psql` installed:

```bash
# Get DATABASE_URL from Railway dashboard
psql "YOUR_DATABASE_URL_HERE" -c "UPDATE subscription_plans SET is_active = 0, display_name = 'Free Trial' WHERE name = 'trial';"
```

---

## Option 3: Via Neon Console (if using Neon)

1. Go to https://console.neon.tech
2. Select your project
3. Click **SQL Editor**
4. Paste and run the SQL above

---

## What This Does:

✅ **Before**: Trial plan shows in /pricing page (is_active = 1)  
✅ **After**: Trial plan hidden from /pricing (is_active = 0)

**Result**:
- Pricing page shows only: BASIC, PRO, PREMIUM
- Trial still auto-assigned on user registration
- More professional look (no Free Trial card to confuse users)

---

## Verify It Worked:

After running the SQL, check your pricing page:
- Visit: https://pocketbizz-production-f02a.up.railway.app/pricing
- You should see only 3 plans: BASIC, PRO, PREMIUM
- Trial should NOT appear

---

## File Location:

The SQL script is saved at:
`/workspaces/pocketbizz/migrations/update-trial-plan.sql`

You can also just copy-paste this:

```sql
UPDATE subscription_plans 
SET is_active = 0, display_name = 'Free Trial' 
WHERE name = 'trial';
```
