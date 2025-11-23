# Fly.io Deployment Guide - PocketBizz

## 🚀 Quick Start (15 minutes)

### Prerequisites
- Fly.io account (free): https://fly.io/signup
- Credit card (for verification, won't be charged on free tier)

---

## Step 1: Install Fly CLI

```bash
# Install flyctl
curl -L https://fly.io/install.sh | sh

# Add to PATH (restart terminal after)
export FLYCTL_INSTALL="/home/codespace/.fly"
export PATH="$FLYCTL_INSTALL/bin:$PATH"

# Verify installation
flyctl version
```

---

## Step 2: Login to Fly.io

```bash
flyctl auth login
```

This will open browser for authentication.

---

## Step 3: Create Fly.io App

```bash
# Launch app (will use fly.toml config)
flyctl launch --no-deploy

# When prompted:
# - App name: pocketbizz (or your preferred name)
# - Region: sin (Singapore)
# - PostgreSQL: Yes (select Development - single node, 1x shared CPU, 256MB RAM)
# - Redis: Yes (select 256MB)
# - Deploy now: No
```

---

## Step 4: Set Environment Variables

```bash
# Set secrets (encrypted)
flyctl secrets set \
  DATABASE_URL="postgresql://neondb_owner:npg_8kHAnvrRuVQqep-morning-thunder-a1qym7wn-pooler-ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require" \
  SESSION_SECRET="03aa6e8f7fce42e3f21b17c34c2741b15fb5d1e858447435e07e761f80f5521024d773e5f8ef83a93ec1d546b1f1c0083ba9f993e43f06c5ea950740fea07c3b" \
  RESEND_API_KEY="re_7s8wmC6S_PwootrQvQA81gJ3c68aKN1ph" \
  BCL_WEBHOOK_SECRET="8SsKFV8UR5qeyD7Eq0a141ZF1AXGCWJ5" \
  CRON_SECRET="c91507a71dd22263c974e9e30dde96baf19b642b0de4a14d4608efd82800a74d" \
  TOYYIBPAY_USER_SECRET_KEY="your-toyyibpay-key"

# Set public environment variables
flyctl config set \
  ALLOWED_ORIGINS="https://pocketbizz.fly.dev" \
  PUBLIC_URL="https://pocketbizz.fly.dev" \
  SENTRY_DSN="https://7145d0446fd0b3f087bb7675376c7cc2@o451030703754448.ingest.us.sentry.io/4510307068018688" \
  BCL_DEBUG_LOG="1"
```

**Note:** If using Fly.io PostgreSQL instead of Neon, DATABASE_URL will be auto-injected.

---

## Step 5: Deploy

```bash
# Deploy to Fly.io
flyctl deploy

# Monitor deployment
flyctl logs
```

Deployment takes ~3-5 minutes.

---

## Step 6: Verify Deployment

```bash
# Check app status
flyctl status

# Test endpoint
curl https://pocketbizz.fly.dev/api/session

# Open in browser
flyctl open
```

Expected response:
```json
{"authenticated":false}
```

---

## Step 7: Scale (Optional)

```bash
# Scale to 2 VMs for high availability (still free tier)
flyctl scale count 2

# Scale up memory if needed (costs money)
flyctl scale memory 512

# View current scaling
flyctl scale show
```

---

## Step 8: Custom Domain (Optional)

```bash
# Add custom domain
flyctl certs add app.pocketbizz.my

# Get certificate status
flyctl certs show app.pocketbizz.my
```

**Then update DNS:**
```
Type: CNAME
Name: app
Value: pocketbizz.fly.dev
```

**Update environment variables:**
```bash
flyctl secrets set \
  ALLOWED_ORIGINS="https://app.pocketbizz.my" \
  PUBLIC_URL="https://app.pocketbizz.my"
```

---

## Monitoring & Maintenance

### View Logs
```bash
# Real-time logs
flyctl logs

# Last 200 lines
flyctl logs -n 200
```

### SSH into VM
```bash
# Access running container
flyctl ssh console
```

### Restart App
```bash
# Restart all VMs
flyctl apps restart pocketbizz
```

### View Metrics
```bash
# Dashboard
flyctl dashboard

# Or visit: https://fly.io/apps/pocketbizz/metrics
```

---

## Database Management

### Using Fly.io PostgreSQL

```bash
# Connect to database
flyctl postgres connect -a pocketbizz-db

# Run migrations
flyctl ssh console -C "npm run db:push"

# Database dashboard
flyctl postgres dashboard pocketbizz-db
```

### Using External Neon Database

DATABASE_URL already set in secrets. No additional setup needed.

---

## CI/CD with GitHub Actions

Create `.github/workflows/fly-deploy.yml`:

```yaml
name: Fly.io Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - uses: superfly/flyctl-actions/setup-flyctl@master
      
      - run: flyctl deploy --remote-only
        env:
          FLY_API_TOKEN: ${{ secrets.FLY_API_TOKEN }}
```

**Setup:**
```bash
# Get API token
flyctl auth token

# Add to GitHub Secrets:
# Repository → Settings → Secrets → New secret
# Name: FLY_API_TOKEN
# Value: <your-token>
```

---

## Cost Optimization

**Free Tier Limits:**
- 3 shared VMs (256MB each)
- 160GB bandwidth/month
- 3GB PostgreSQL storage

**Stay within free tier:**
```bash
# Use exactly 1-3 VMs (not more)
flyctl scale count 1

# Use 256MB RAM (default)
flyctl scale memory 256

# Monitor usage
flyctl dashboard
```

**When you exceed free tier:**
- Additional VMs: ~$1.94/month each
- Extra bandwidth: $0.02/GB
- Extra storage: $0.15/GB/month

---

## Troubleshooting

### Build fails
```bash
# Check build logs
flyctl logs

# Deploy with verbose output
flyctl deploy --verbose
```

### App won't start
```bash
# Check health check
flyctl checks list

# View startup logs
flyctl logs -n 500

# SSH and debug
flyctl ssh console
node dist/index.js
```

### 502 errors
```bash
# Verify PORT binding (should be 8080)
flyctl config show

# Check if app is listening
flyctl ssh console
curl http://localhost:8080/api/session
```

### Database connection fails
```bash
# Verify DATABASE_URL secret
flyctl secrets list

# Test connection
flyctl ssh console
node -e "const {Pool}=require('pg'); new Pool({connectionString:process.env.DATABASE_URL}).query('SELECT 1').then(()=>console.log('OK'))"
```

---

## Migration from Railway

1. **Deploy to Fly.io first** (test thoroughly)
2. **Update DNS** to point to Fly.io
3. **Update webhooks** (ToyyibPay, etc.)
4. **Monitor for 24-48 hours**
5. **Pause Railway service** (don't delete immediately)
6. **After 1 week stable:** Delete Railway

---

## Quick Commands Reference

```bash
# Deploy
flyctl deploy

# Logs
flyctl logs

# Status
flyctl status

# Scale
flyctl scale count 2
flyctl scale memory 512

# SSH
flyctl ssh console

# Restart
flyctl apps restart

# Dashboard
flyctl dashboard

# Secrets
flyctl secrets list
flyctl secrets set KEY=value
flyctl secrets unset KEY
```

---

## Support

**Documentation:** https://fly.io/docs  
**Community:** https://community.fly.io  
**Status:** https://status.fly.io

---

## Next Steps After Deployment

1. ✅ Test all features (login, products, sales, PDF)
2. ✅ Run load tests: `./run-load-tests.sh basic https://pocketbizz.fly.dev`
3. ✅ Update payment webhook URLs
4. ✅ Configure custom domain
5. ✅ Setup GitHub Actions for auto-deploy
6. ✅ Monitor logs for 24 hours
7. ✅ Migrate DNS from Railway
