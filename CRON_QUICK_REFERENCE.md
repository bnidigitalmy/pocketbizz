# Cron Job Quick Reference Card

## 📋 Essential Information

**Cron Schedule:** Daily at 2 AM UTC (9 AM Malaysia Time)  
**Endpoint:** `POST /api/cron/enforce-grace-period`  
**Authentication:** Header `x-cron-secret: <CRON_SECRET>`

## 🔑 CRON_SECRET

```
c91507a71dd22263c974e9e30dde96baf19b642b0de4a14d4608efd02800a74d
```

**⚠️ SECURITY:** Keep this secret safe! Add it to:
- Railway: Dashboard → Variables → `CRON_SECRET`
- GitHub: Settings → Secrets → Actions → `CRON_SECRET`

## 🧪 Testing Commands

### Local Testing
```bash
# Start your dev server first
npm run dev

# In another terminal, run tests
./test-cron.sh local

# Or manual curl
curl -X POST http://localhost:5000/api/cron/enforce-grace-period \
  -H "x-cron-secret: YOUR_SECRET_HERE"
```

### Production Testing
```bash
# Interactive test (will prompt for secret)
./test-cron.sh production

# Or manual curl
curl -X POST https://pocketbizz-production.up.railway.app/api/cron/enforce-grace-period \
  -H "x-cron-secret: c91507a71dd22263c974e9e30dde96baf19b642b0de4a14d4608efd02800a74d"
```

### Health Check (No Auth Required)
```bash
curl http://localhost:5000/api/cron/health
curl https://pocketbizz-production.up.railway.app/api/cron/health
```

## 🎯 GitHub Actions

**Manual Trigger:**
1. Go to: https://github.com/bnidigitalmy/pocketbizz/actions
2. Select "Daily Grace Period Check"
3. Click "Run workflow"

**View Logs:**
1. Go to Actions tab
2. Click on the workflow run
3. Expand the job steps

**Expected Schedule:**
- Runs automatically at 2 AM UTC daily
- Can be triggered manually anytime

## 📊 Expected Responses

### Success (No users to process)
```json
{
  "success": true,
  "processed": 0,
  "results": []
}
```

### Success (Users processed)
```json
{
  "success": true,
  "processed": 2,
  "results": [
    {
      "userId": 42,
      "email": "john@example.com",
      "archived": {
        "products": 15,
        "vendors": 3,
        "resellers": 2,
        "customers": 10,
        "stockItems": 5
      }
    }
  ]
}
```

### Error (Unauthorized)
```json
{
  "error": "Unauthorized - Invalid or missing cron secret"
}
```

## 🔍 Monitoring

### Railway Logs
```bash
# In Railway dashboard
# Go to: Deployments → Select latest → View Logs
# Search for: [CRON]
```

Expected log output:
```
[CRON] Starting daily grace period check...
[CRON] Grace period check complete. Processed 3 users.
[CRON] Archive summary:
  - User 42 (john@example.com): { productsArchived: 30, ... }
```

### GitHub Actions Logs
```bash
# In GitHub Actions tab
# Click on workflow run
# Expand "Trigger grace period enforcement" step
```

Expected output:
```
✅ CRON_SECRET is configured
HTTP Status: 200
Response: {"success":true,"processed":0,"results":[]}
✅ Grace period check completed successfully
```

## 🚨 Troubleshooting

| Issue | Solution |
|-------|----------|
| `401 Unauthorized` | Check CRON_SECRET is set correctly in Railway/GitHub |
| `500 Internal Server Error` | Check Railway logs for errors in cron.ts or archiving.ts |
| GitHub Action fails | Verify CRON_SECRET is in repository secrets |
| Cron doesn't run | Check GitHub Actions tab for schedule execution |
| Too many users archived | Review `graceEndsAt` dates in database |

## 📁 Related Files

- **Implementation:** `server/cron.ts`
- **Archiving logic:** `server/archiving.ts`
- **GitHub workflow:** `.github/workflows/daily-grace-period.yml`
- **Test script:** `test-cron.sh`
- **Full guide:** `CRON_SETUP_GUIDE.md`

## ⏱️ Timeline (Malaysia Time - UTC+8)

| UTC Time | Malaysia Time | Action |
|----------|---------------|---------|
| 2:00 AM | 10:00 AM | Cron job executes |
| 3:00 AM | 11:00 AM | Safe to check logs |

## 🎓 What It Does

1. Finds users where `graceEndsAt < NOW()` and they **have no active subscription or trial**
2. Gets their plan limits (Free plan: 5 products, 3 vendors, etc.)
3. Archives excess data (oldest first):
   - Products beyond limit → `isArchived = true`
   - Vendors beyond limit → `isArchived = true`
   - Resellers beyond limit → `isArchived = true`
   - Customers beyond limit → `isArchived = true`
  - Stock items beyond limit → `isArchived = true`
4. Clears `graceEndsAt` and sets `isOnTrial = false`
5. Logs results

## 🔄 Next Steps

After setting up:
- [ ] Set CRON_SECRET in Railway
- [ ] Set CRON_SECRET in GitHub
- [ ] Run test script locally: `./test-cron.sh local`
- [ ] Run manual GitHub Action
- [ ] Monitor first automated run (next day at 10 AM Malaysia Time)
- [ ] Consider adding email notifications (future enhancement)

---

**Need help?** Check the full guide: `CRON_SETUP_GUIDE.md`
