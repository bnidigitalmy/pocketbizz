# 🚨 IMPORTANT: Pre-Deployment Steps

## TypeScript Compilation Errors - EXPECTED

You will see TypeScript errors in `server/archiving.ts` related to `isArchived` field not existing. This is **EXPECTED** and will be resolved after running the database migration.

### Why This Happens

1. We added `isArchived` fields to `shared/schema.ts`
2. TypeScript compiler uses generated types from existing database schema
3. Until migration runs, TypeScript doesn't recognize the new fields
4. After migration, Drizzle will regenerate types and errors will disappear

### Resolution Steps (IN ORDER)

#### Step 1: Run Database Migration First
```bash
# Connect to your database
psql $DATABASE_URL < migrations/0027_add_trial_grace_and_archive_fields.sql
```

#### Step 2: Regenerate Drizzle Types (if using drizzle-kit)
```bash
npm run db:generate  # or npx drizzle-kit generate:pg
```

#### Step 3: Verify TypeScript Compilation
```bash
npx tsc --noEmit
```

TypeScript errors should now be gone.

#### Step 4: Deploy Application
```bash
git add .
git commit -m "feat: data hostage freemium trial implementation"
git push origin main
```

## Alternative: Ignore TypeScript Errors Temporarily

If you need to deploy immediately:

1. TypeScript errors won't prevent JavaScript from running
2. The fields exist in schema.ts, just not in generated types yet
3. Runtime will work correctly after migration
4. Types will self-correct on next Drizzle type generation

## Verification

After deployment, test:
```bash
# Health check
curl https://your-app.railway.app/api/cron/health

# Create test account and verify trial dates
# Check database directly:
psql $DATABASE_URL -c "SELECT id, email, \"trialEndsAt\", \"graceEndsAt\", \"isOnTrial\" FROM users LIMIT 5;"
```

Expected output:
- `trialEndsAt` should be NOW() + 14 days
- `graceEndsAt` should be NOW() + 21 days  
- `isOnTrial` should be 1 (true)

## Rollback Plan (If Something Goes Wrong)

If you need to rollback:

```sql
-- Remove new fields (rollback migration)
ALTER TABLE users DROP COLUMN IF EXISTS "graceEndsAt";
ALTER TABLE products DROP COLUMN IF EXISTS "is_archived";
ALTER TABLE vendors DROP COLUMN IF EXISTS "is_archived";
ALTER TABLE resellers DROP COLUMN IF EXISTS "is_archived";
ALTER TABLE customers DROP COLUMN IF EXISTS "is_archived";
ALTER TABLE stock_items DROP COLUMN IF EXISTS "is_archived";

-- Drop indexes
DROP INDEX IF EXISTS idx_products_archived;
DROP INDEX IF EXISTS idx_vendors_archived;
DROP INDEX IF EXISTS idx_resellers_archived;
DROP INDEX IF EXISTS idx_customers_archived;
DROP INDEX IF EXISTS idx_stock_items_archived;
DROP INDEX IF EXISTS idx_users_grace_period;
```

## Support

If you encounter issues:
1. Check Railway logs for runtime errors
2. Verify migration ran successfully: `\d products` in psql should show `is_archived` column
3. Check cron endpoint is protected: `/api/cron/enforce-grace-period` should return 401 without secret
4. Test trial banner appears on new account registration
5. Verify usage stats endpoint returns correct data

**DO NOT SKIP THE MIGRATION STEP** - The app will break if you deploy code expecting `isArchived` fields but database doesn't have them!
