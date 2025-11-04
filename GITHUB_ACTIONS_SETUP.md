# GitHub Actions Setup Guide - Database Backup

## 🔴 Required: Add DATABASE_URL Secret

Your GitHub Actions workflow for weekly database backups needs the `DATABASE_URL` secret to connect to your Neon PostgreSQL database.

---

## ✅ Step-by-Step Instructions

### 1. Get Your DATABASE_URL

Your DATABASE_URL is already in your `.env` file. It looks like:
```
postgresql://username:password@hostname/database?sslmode=require
```

**⚠️ DO NOT commit this to Git!** It contains your database credentials.

---

### 2. Add Secret to GitHub Repository

#### Option A: Via GitHub Web Interface (Recommended)

1. Go to your repository: https://github.com/bnidigitalmy/pocketbizz

2. Click **Settings** (top navigation)

3. Click **Secrets and variables** → **Actions** (left sidebar)

4. Click **New repository secret**

5. Fill in:
   - **Name:** `DATABASE_URL`
   - **Secret:** Paste your full DATABASE_URL from `.env` file
   
6. Click **Add secret**

7. ✅ Done! Your workflow can now access it via `${{ secrets.DATABASE_URL }}`

#### Option B: Via GitHub CLI (If you have admin token)

```bash
# Read DATABASE_URL from .env
DATABASE_URL=$(grep "^DATABASE_URL=" .env | cut -d'=' -f2-)

# Set secret (requires admin permissions)
gh secret set DATABASE_URL --body "$DATABASE_URL"
```

**Note:** Current token doesn't have admin permissions, so use Option A instead.

---

### 3. Verify Secret is Set

#### Check via Web Interface:
1. Go to Settings → Secrets and variables → Actions
2. You should see `DATABASE_URL` in the list
3. ✅ If visible, it's properly configured

#### Test via Manual Workflow Run:
1. Go to **Actions** tab in GitHub
2. Click **Weekly Database Backup** workflow
3. Click **Run workflow** → **Run workflow**
4. Wait for completion (should succeed)
5. Check "Artifacts" for the backup file

---

## 📋 What This Secret is Used For

The `DATABASE_URL` secret is used in:

### `.github/workflows/backup.yml`
```yaml
- name: Create backup
  env:
    DATABASE_URL: ${{ secrets.DATABASE_URL }}
  run: |
    pg_dump "$DATABASE_URL" > backup.sql
```

**Purpose:**
- Weekly automated database backups (every Sunday 2 AM UTC)
- Manual backup trigger via GitHub Actions
- Database health verification after backup

---

## 🔒 Security Best Practices

✅ **DO:**
- Store DATABASE_URL as GitHub secret (encrypted at rest)
- Use it only in trusted workflows
- Rotate credentials periodically
- Use read-only replica URL for backups (if available)

❌ **DON'T:**
- Commit DATABASE_URL to repository
- Print DATABASE_URL in workflow logs
- Share DATABASE_URL in public issues/PRs
- Use production credentials in public repos

---

## 🧪 Testing the Setup

After adding the secret:

### 1. Manual Test Run
```bash
# Go to GitHub Actions
# → Weekly Database Backup workflow
# → Run workflow button
# → Check logs for success
```

### 2. Check Backup Artifact
```bash
# After workflow completes:
# → Click on the workflow run
# → Scroll to "Artifacts" section
# → Download "database-backup-XXX.sql.gz"
# → Verify file size (should be ~10-100 KB)
```

### 3. Verify Backup Content (Optional)
```bash
# Download the artifact
gunzip database-backup-XXX.sql.gz
head -n 20 database-backup-XXX.sql

# Should see:
# -- PostgreSQL database dump
# -- Dumped from database version XX.X
# CREATE TABLE users ...
```

---

## 📅 Backup Schedule

**Automatic Runs:**
- ⏰ Every Sunday at 2:00 AM UTC (10:00 AM Malaysia time)
- 📦 Backup stored as GitHub artifact
- 🗑️ Retention: 90 days

**Manual Runs:**
- Available via "Run workflow" button anytime
- Useful before major changes
- Same backup process as scheduled runs

---

## 🐛 Troubleshooting

### Error: "secrets.DATABASE_URL is empty"
**Solution:** DATABASE_URL secret not set. Follow Step 2 above.

### Error: "FATAL: password authentication failed"
**Solution:** DATABASE_URL credentials are wrong. Get fresh URL from Neon dashboard.

### Error: "connection timeout"
**Solution:** Neon database might be suspended (free tier). Wake it up by visiting Railway app.

### Error: "permission denied"
**Solution:** DATABASE_URL user doesn't have backup permissions. Use owner/admin role.

### Error: "server version mismatch"
**Example:** `server version: 17.5; pg_dump version: 16.10`
**Solution:** Workflow has been updated to install PostgreSQL 17 client to match Neon database version. If you see this error, pull the latest workflow file from main branch.

### Error: "fatal: No url found for submodule"
**Solution:** This is a harmless warning during cleanup. Ignore it or remove any .gitmodules file if present.

### Workflow doesn't run automatically
**Solution:** 
1. Check if Actions are enabled: Settings → Actions → General
2. Verify workflow file is in `.github/workflows/` on main branch
3. Wait for next Sunday 2 AM UTC

---

## ✅ Completion Checklist

- [ ] DATABASE_URL secret added to GitHub repository
- [ ] Secret visible in Settings → Secrets and variables → Actions
- [ ] Manual workflow run successful
- [ ] Backup artifact downloaded and verified
- [ ] Weekly schedule confirmed in Actions tab
- [ ] Team members notified about backup system

---

## 🎯 Next Steps After Setup

1. **Test restore process** - Practice restoring from backup
2. **Monitor weekly runs** - Check GitHub Actions email notifications
3. **Document restore procedures** - See `DATABASE_BACKUPS.md`
4. **Set up monitoring** - Get alerts if backup fails

---

## 📚 Related Documentation

- `DATABASE_BACKUPS.md` - Complete backup & recovery guide
- `scripts/backup-database.js` - Local backup script
- `scripts/verify-database.js` - Database health checker
- `.github/workflows/backup.yml` - Workflow configuration

---

**Last Updated:** November 4, 2025  
**Status:** ⚠️ Awaiting DATABASE_URL secret setup  
**Action Required:** Add DATABASE_URL to GitHub secrets (5 minutes)
