# Database Backup & Recovery Guide

## 🛡️ Overview

PocketBizz uses **Neon PostgreSQL** (via Railway) which provides automatic backup features. This guide covers backup strategy, manual backups, and disaster recovery procedures.

---

## 📊 Current Backup Status

### Neon Auto-Backups (Built-in)
- ✅ **Automatic daily backups** (included in all Neon plans)
- ✅ **7-day retention** on Free tier
- ✅ **30-day retention** on Pro tier
- ✅ **Point-in-time recovery** (Pro tier only)
- ✅ **Instant snapshots** available

### What's Backed Up
- ✅ All tables and data
- ✅ Database schema
- ✅ Indexes and constraints
- ✅ User accounts and permissions

---

## 🚀 Backup Strategy

### 1. Automatic Backups (Primary)
**Provider:** Neon PostgreSQL  
**Frequency:** Daily  
**Retention:** 7-30 days (depending on plan)  
**Action Required:** None - automatic

### 2. Manual Backups (Secondary)
**When to use:**
- Before major migrations
- Before bulk data operations
- Before schema changes
- Weekly for extra safety

**How to create:**
```bash
# Run manual backup script
npm run db:backup
```

### 3. Export Backups (Tertiary)
**When to use:**
- Monthly archives
- Compliance requirements
- Long-term storage

---

## 📝 Backup Procedures

### A. Railway/Neon Dashboard Backup

1. **Go to Railway Dashboard**
   - Navigate to your project
   - Click on PostgreSQL service
   - Go to **Backups** tab

2. **View Available Backups**
   - See automatic daily backups
   - Check backup status and dates

3. **Create Manual Snapshot**
   - Click **"Create Backup"**
   - Add description (e.g., "Pre-migration backup")
   - Wait for completion

### B. Command-Line Backup (pg_dump)

```bash
# Backup entire database
npm run db:backup

# Or manually with pg_dump
pg_dump $DATABASE_URL > backups/pocketbizz_$(date +%Y%m%d_%H%M%S).sql

# Backup with compression
pg_dump $DATABASE_URL | gzip > backups/pocketbizz_$(date +%Y%m%d).sql.gz

# Backup schema only
pg_dump --schema-only $DATABASE_URL > backups/schema_$(date +%Y%m%d).sql
```

### C. Automated Weekly Backups (GitHub Actions)

See `.github/workflows/backup.yml` for automated weekly backups stored in GitHub artifacts.

---

## 🔄 Restore Procedures

### Scenario 1: Restore from Neon Backup (Simple)

**Use when:** Need to restore from recent backup (within 7-30 days)

1. **Go to Railway/Neon Dashboard**
2. **Navigate to Backups tab**
3. **Select backup to restore**
4. **Click "Restore"**
5. **Choose restore target:**
   - Same database (overwrites current data)
   - New branch (creates separate database)
6. **Confirm and wait for completion**

⏱️ **Time:** 5-30 minutes depending on database size

---

### Scenario 2: Restore from pg_dump File

**Use when:** Restoring from manual backup file

```bash
# 1. Drop existing database (CAREFUL!)
# dropdb $DATABASE_URL  # Only if you're sure!

# 2. Create fresh database
# createdb pocketbizz_new

# 3. Restore from backup
psql $DATABASE_URL < backups/pocketbizz_20250104.sql

# 4. Or from compressed backup
gunzip -c backups/pocketbizz_20250104.sql.gz | psql $DATABASE_URL

# 5. Verify restoration
npm run db:verify
```

⏱️ **Time:** 10-60 minutes depending on file size

---

### Scenario 3: Point-in-Time Recovery (Pro Plan Only)

**Use when:** Need to restore to specific timestamp

1. **Go to Neon Dashboard**
2. **Select "Point-in-Time Recovery"**
3. **Choose exact timestamp**
4. **Create new branch from that point**
5. **Test the restored data**
6. **Swap to use restored database**

⏱️ **Time:** 15-45 minutes

---

## 🧪 Backup Verification

### Verify Backup Exists
```bash
# Check Railway/Neon backups
# (Manual check in dashboard)

# Check local backup files
ls -lh backups/

# Verify backup integrity
npm run db:verify-backup
```

### Test Restore (Dry Run)
```bash
# Create test database
createdb pocketbizz_test

# Restore to test database
psql pocketbizz_test < backups/latest.sql

# Verify data
psql pocketbizz_test -c "SELECT COUNT(*) FROM users;"

# Drop test database
dropdb pocketbizz_test
```

---

## 📋 Backup Checklist

### Before Major Changes
- [ ] Create manual snapshot in Railway
- [ ] Run `npm run db:backup` for local copy
- [ ] Document what changes you're making
- [ ] Verify backup was successful
- [ ] Note the backup timestamp

### Weekly Maintenance
- [ ] Check that automatic backups are running
- [ ] Verify last backup date
- [ ] Test restore on dev database (monthly)
- [ ] Review backup storage usage

### Monthly
- [ ] Create long-term archive export
- [ ] Store copy in external location (Google Drive, etc.)
- [ ] Review and clean old local backups
- [ ] Test full restore procedure

---

## 🚨 Disaster Recovery Plan

### Step 1: Assess Damage
- What data was lost?
- When did the incident occur?
- Is the database still accessible?

### Step 2: Stop All Write Operations
```bash
# Put app in maintenance mode
# (Update Railway env var)
MAINTENANCE_MODE=true
```

### Step 3: Identify Recovery Point
- Check last good backup date
- Determine acceptable data loss
- Select appropriate backup

### Step 4: Restore Database
Follow restore procedures above based on backup type.

### Step 5: Verify Restoration
```bash
# Check critical tables
npm run db:verify

# Verify user accounts exist
psql $DATABASE_URL -c "SELECT COUNT(*) FROM users;"

# Check recent data
psql $DATABASE_URL -c "SELECT MAX(created_at) FROM sales;"
```

### Step 6: Resume Operations
- Remove maintenance mode
- Monitor for issues
- Notify users if needed

---

## 💾 Backup Storage Recommendations

### Short-term (7-30 days)
✅ **Neon automatic backups** - Primary  
✅ **Railway backups** - Secondary

### Medium-term (30-90 days)
✅ **Local backups folder** - Manual snapshots  
✅ **GitHub Actions artifacts** - Automated weekly

### Long-term (1 year+)
✅ **Google Drive** - Monthly exports  
✅ **External cloud storage** - Compliance archives

---

## 📈 Monitoring & Alerts

### What to Monitor
- ✅ Last backup date (should be < 24 hours)
- ✅ Backup size (sudden changes indicate issues)
- ✅ Backup success/failure status
- ✅ Storage usage

### Setup Alerts
1. **Neon Dashboard** - Enable backup failure emails
2. **Sentry** - Add database backup monitoring
3. **Custom Script** - Weekly backup verification

---

## 🔧 Backup Scripts

### Available Commands
```bash
# Create manual backup
npm run db:backup

# Verify backup integrity
npm run db:verify-backup

# List available backups
npm run db:list-backups

# Restore from backup
npm run db:restore <backup-file>
```

---

## 📊 Recovery Time Objectives (RTO)

| Scenario | Target RTO | Actual RTO |
|----------|-----------|------------|
| Point-in-time recovery (Pro) | 15 min | 15-45 min |
| Neon snapshot restore | 30 min | 5-30 min |
| pg_dump restore | 1 hour | 10-60 min |
| Full disaster recovery | 2 hours | 1-4 hours |

---

## 📝 Important Notes

### ⚠️ What Backups DON'T Include
- ❌ Redis session data (sessions are temporary)
- ❌ Uploaded files (use Google Drive sync)
- ❌ Application code (use Git)
- ❌ Environment variables (document separately)

### 💡 Best Practices
1. **Test restores regularly** - Backups are useless if you can't restore
2. **Document everything** - Future you will thank current you
3. **Multiple backup locations** - Don't rely on single provider
4. **Automate where possible** - Humans forget, scripts don't
5. **Monitor backup health** - Know when backups fail

---

## 🆘 Emergency Contacts

### If Database is Down
1. Check Railway status page
2. Check Neon status page
3. Check Sentry for errors
4. Contact support if needed

### Support Resources
- **Railway Support:** https://railway.app/help
- **Neon Support:** https://neon.tech/docs/introduction/support
- **PocketBizz Dev Team:** [Your contact info]

---

## 📚 Additional Resources

- [Neon Backup Documentation](https://neon.tech/docs/manage/backups)
- [PostgreSQL Backup & Recovery](https://www.postgresql.org/docs/current/backup.html)
- [Railway Database Guide](https://docs.railway.app/databases/postgresql)

---

**Last Updated:** November 4, 2025  
**Next Review:** December 4, 2025
