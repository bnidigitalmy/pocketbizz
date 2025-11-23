# Railway Cron Job Setup for PocketBizz

This guide explains how to set up automated cron jobs to enforce grace period data archiving.

## 🚀 Quick Start (TL;DR)

1. **Generate secret:** `openssl rand -hex 32`
2. **Add to Railway:** Dashboard → Variables → Add `CRON_SECRET`
3. **Add to GitHub:** Repository → Settings → Secrets → Add `CRON_SECRET` (same value)
4. **Test:** Go to GitHub Actions → Run "Daily Grace Period Check" manually
5. **Done!** Cron runs daily at 2 AM UTC (9 AM Malaysia Time)

**Current Status:**
- ✅ Cron endpoint implemented (`/api/cron/enforce-grace-period`)
- ✅ Security middleware active (requires `x-cron-secret` header)
- ✅ GitHub Actions workflow created (`.github/workflows/daily-grace-period.yml`)
- ⏳ Awaiting: CRON_SECRET configuration in Railway & GitHub

---

## Option 1: Railway Cron Jobs (Recommended for Railway)

Railway supports cron jobs through their dashboard. Here's how to set it up:

### 1. Generate CRON_SECRET

First, generate a secure secret token:

```bash
openssl rand -hex 32
```

Example output: `c91507a71dd22263c974e9e30dde96baf19b642b0de4a14d4608efd02800a74d`

### 2. Add Environment Variable in Railway

1. Go to [Railway Dashboard](https://railway.app)
2. Select your PocketBizz project
3. Click on your service (main web app)
4. Go to **Variables** tab
5. Add new variable:
   - **Name:** `CRON_SECRET`
   - **Value:** `c91507a71dd22263c974e9e30dde96baf19b642b0de4a14d4608efd02800a74d` (use your generated secret)
6. Click **Add** and your app will redeploy

### 3. Create Railway Cron Job

**Note:** As of 2024, Railway deprecated built-in cron jobs. Use **GitHub Actions** (Option 2) or external services instead.

Alternatively, Railway users can:
- Use Railway's **Deployments API** with external cron services
- Trigger webhooks from services like cron-job.org
- Use GitHub Actions (recommended - see Option 2)

### 4. Verify Endpoint Protection

The endpoint is already protected in `server/cron.ts`:

```typescript
app.post("/api/cron/enforce-grace-period", async (req: any, res: any) => {
  const cronSecret = req.headers['x-cron-secret'];
  
  if (!cronSecret || cronSecret !== process.env.CRON_SECRET) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  
  // ... enforcement logic
});
```

✅ Protection is already implemented!

## Option 2: GitHub Actions (Recommended ⭐)

GitHub Actions is now the recommended approach for Railway apps. The workflow is already created!

### 1. Add CRON_SECRET to GitHub Secrets

1. Go to your repository: `https://github.com/bnidigitalmy/pocketbizz`
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add:
   - **Name:** `CRON_SECRET`
   - **Value:** `c91507a71dd22263c974e9e30dde96baf19b642b0de4a14d4608efd02800a74d` (same as Railway)
5. Click **Add secret**

### 2. Verify Workflow File

The workflow is already created at `.github/workflows/daily-grace-period.yml`:

```yaml
name: Daily Grace Period Check

on:
  schedule:
    # Run daily at 2 AM UTC (9 AM Malaysia Time)
    - cron: '0 2 * * *'
  workflow_dispatch: # Allow manual trigger

jobs:
  enforce-grace-period:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger grace period enforcement
        run: |
          curl -X POST https://pocketbizz-production.up.railway.app/api/cron/enforce-grace-period \
            -H "x-cron-secret: ${{ secrets.CRON_SECRET }}"
```

✅ Workflow file is ready!

### 3. Test Manual Trigger

1. Go to **Actions** tab in GitHub
2. Select **Daily Grace Period Check**
3. Click **Run workflow** → **Run workflow**
4. Check the logs to verify it works

### 4. Update Production URL (if different)

If your Railway app URL is different, update line 23 in `.github/workflows/daily-grace-period.yml`:

```yaml
https://YOUR-ACTUAL-APP.up.railway.app/api/cron/enforce-grace-period
```

## Option 3: External Cron Services

Use services like:
- **cron-job.org** (free, reliable)
- **EasyCron** (paid, more features)
- **UptimeRobot** (free monitoring + cron)

Configure them to hit:
```
POST https://your-app.railway.app/api/cron/enforce-grace-period
Headers: x-cron-secret: YOUR_SECRET
```

## Testing the Cron Job

### Manual Trigger (for testing)

```bash
# From terminal
curl -X POST http://localhost:5000/api/cron/enforce-grace-period \
  -H "x-cron-secret: your-secret-here"

# Or use the admin panel (TODO: create admin UI)
```

### Check Cron Health

```bash
curl http://localhost:5000/api/cron/health
```

Response:
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T02:00:00.000Z",
  "jobs": [
    {
      "name": "enforce-grace-period",
      "schedule": "0 2 * * *",
      "description": "Daily check for expired grace periods and archive excess data"
    }
  ]
}
```

## What the Cron Job Does

Every day at 2 AM:
1. Finds users whose `graceEndsAt < NOW()` with **no active subscription or trial**
2. Gets their plan limits
3. Archives excess data (oldest first):
   - Products beyond limit → `isArchived = true`
   - Vendors beyond limit → `isArchived = true`
   - Resellers beyond limit → `isArchived = true`
   - Customers beyond limit → `isArchived = true`
  - Stock items beyond limit → `isArchived = true`
4. Clears `graceEndsAt` and sets `isOnTrial = false`
5. Logs results to console

## Monitoring

Check Railway logs for cron execution:
```
[CRON] Starting daily grace period check...
[CRON] Grace period check complete. Processed 3 users.
[CRON] Archive summary:
  - User 42 (john@example.com): { productsArchived: 30, vendorsArchived: 5, ... }
```

## Email Notifications (TODO)

Future enhancement: Send email notifications to users:
- 3 days before grace period ends
- 1 day before grace period ends
- When data is archived (with link to upgrade/restore)

## Security Best Practices

1. **Never expose cron endpoints publicly without auth**
2. **Use strong random secrets** (min 32 characters)
3. **Rotate secrets periodically** (every 90 days)
4. **Rate limit cron endpoints** to prevent abuse
5. **Log all cron executions** for audit trail
6. **Monitor for failed executions** and alert on errors

## Troubleshooting

### Cron not running
- Check Railway logs for errors
- Verify cron schedule syntax
- Ensure environment variables are set
- Test endpoint manually with curl

### Too many/too few users archived
- Check `graceEndsAt` values in database
- Verify subscription tier logic
- Test `enforceGracePeriod()` function manually
- Review plan limits in feature-gating.ts

### Performance issues
- Add database indexes on `graceEndsAt`, `isArchived`
- Batch archive operations
- Add timeout limits
- Consider queueing for large datasets

## Deployment Checklist

Follow these steps to enable cron jobs in production:

### Step 1: Set CRON_SECRET in Railway

- [ ] Generate secret: `openssl rand -hex 32`
- [ ] Copy the output (e.g., `c91507a71dd22263c974e9e30dde96baf19b642b0de4a14d4608efd02800a74d`)
- [ ] Go to [Railway Dashboard](https://railway.app)
- [ ] Navigate to your PocketBizz project → Variables
- [ ] Add `CRON_SECRET` with the generated value
- [ ] Wait for automatic redeploy

### Step 2: Set CRON_SECRET in GitHub

- [ ] Go to `https://github.com/bnidigitalmy/pocketbizz/settings/secrets/actions`
- [ ] Click **New repository secret**
- [ ] Name: `CRON_SECRET`
- [ ] Value: Same secret from Step 1
- [ ] Click **Add secret**

### Step 3: Verify Production URL

- [ ] Check your Railway app URL (e.g., `pocketbizz-production.up.railway.app`)
- [ ] Update `.github/workflows/daily-grace-period.yml` if URL is different (line 23)
- [ ] Commit and push if you made changes

### Step 4: Test Cron Endpoint

```bash
# Replace with your actual URL and secret
curl -X POST https://pocketbizz-production.up.railway.app/api/cron/enforce-grace-period \
  -H "x-cron-secret: c91507a71dd22263c974e9e30dde96baf19b642b0de4a14d4608efd02800a74d"
```

Expected response:
```json
{
  "success": true,
  "processed": 0,
  "results": []
}
```

- [ ] Test passes with 200 OK status
- [ ] Test fails with 401 Unauthorized if secret is wrong

### Step 5: Test Manual GitHub Actions Run

- [ ] Go to GitHub → **Actions** tab
- [ ] Select **Daily Grace Period Check** workflow
- [ ] Click **Run workflow** → **Run workflow**
- [ ] Wait for completion (should be ~30 seconds)
- [ ] Check logs show success ✅

### Step 6: Monitor First Automated Run

The cron will run automatically at **2 AM UTC daily** (9 AM Malaysia Time).

- [ ] Check GitHub Actions the next day
- [ ] Verify workflow ran successfully
- [ ] Check Railway logs for execution confirmation

### Step 7: Set Up Error Alerts (Optional)

- [ ] Configure GitHub Actions notifications (Settings → Notifications)
- [ ] Add Slack/Discord webhook for failures (update workflow)
- [ ] Set up Railway log monitoring/alerts
