# Railway Cron Job Setup for PocketBizz

This guide explains how to set up automated cron jobs on Railway to enforce grace period data archiving.

## Option 1: Railway Cron Jobs (Recommended for Railway)

Railway supports cron jobs through their platform. Here's how to set it up:

### 1. Create a Cron Service in Railway

```bash
# In your railway.json or railway.toml, add:
{
  "services": [
    {
      "name": "web",
      "type": "web",
      "command": "npm start"
    },
    {
      "name": "cron-grace-period",
      "type": "cron",
      "schedule": "0 2 * * *",
      "command": "curl -X POST https://your-app.railway.app/api/cron/enforce-grace-period -H 'x-cron-secret: ${CRON_SECRET}'"
    }
  ]
}
```

### 2. Set Environment Variables

In Railway dashboard:
- Go to your project → Variables
- Add: `CRON_SECRET=your-random-secret-here` (generate with `openssl rand -hex 32`)

### 3. Protect the Endpoint

Update `/workspaces/pocketbizz/server/cron.ts` to verify the secret:

```typescript
app.post("/api/cron/enforce-grace-period", async (req: any, res: any) => {
  const cronSecret = req.headers['x-cron-secret'];
  
  if (!cronSecret || cronSecret !== process.env.CRON_SECRET) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  
  // ... rest of the code
});
```

## Option 2: GitHub Actions (Alternative)

If you prefer GitHub Actions, create `.github/workflows/daily-cron.yml`:

```yaml
name: Daily Grace Period Check

on:
  schedule:
    # Run daily at 2 AM UTC
    - cron: '0 2 * * *'
  workflow_dispatch: # Allow manual trigger

jobs:
  enforce-grace-period:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger grace period enforcement
        run: |
          curl -X POST https://your-app.railway.app/api/cron/enforce-grace-period \
            -H "x-cron-secret: ${{ secrets.CRON_SECRET }}"
```

Then add `CRON_SECRET` to your GitHub repository secrets.

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
1. Finds users whose `graceEndsAt < NOW()` and `subscriptionTier = 'free'`
2. Gets their plan limits
3. Archives excess data (oldest first):
   - Products beyond limit → `isArchived = true`
   - Vendors beyond limit → `isArchived = true`
   - Resellers beyond limit → `isArchived = true`
   - Customers beyond limit → `isArchived = true`
   - Stock items (orphaned) → `isArchived = true`
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

- [ ] Set `CRON_SECRET` environment variable in Railway
- [ ] Update cron.ts to verify secret token
- [ ] Deploy application
- [ ] Create Railway cron service (or GitHub Action)
- [ ] Test manual trigger
- [ ] Monitor first automated run
- [ ] Set up error alerting (Sentry, Datadog, etc)
- [ ] Document cron schedule for team
