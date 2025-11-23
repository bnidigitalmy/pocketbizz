# Stock Creation Bug Fix - November 7, 2025

## Problem
Users were unable to create new stock items, receiving the error:
```
❌ POST /api/stock error: column "movement_type" of relation "stock_movements" does not exist
```

Additionally, there was a Redis caching error:
```
[Cache] ERROR setting products:list:...: TypeError: redis.setex is not a function
```

## Root Cause Analysis

### Issue 1: Database Schema Mismatch
The `stock_movements` table in the database had an outdated schema that didn't match the code:

**Database had:**
- `type` (should be `movement_type`)
- `quantity` (should be `quantity_before`, `quantity_change`, `quantity_after`)
- `unit_cost` (deprecated column)
- Missing columns: `quantity_before`, `quantity_change`, `quantity_after`, `reason`, `created_by`

**Code expected (from schema.ts):**
- `movement_type` (stock_movement_type enum)
- `quantity_before` (numeric)
- `quantity_change` (numeric)
- `quantity_after` (numeric)
- `reason` (text)
- `created_by` (varchar)

The migration file `0002_third_fat_cobra.sql` had the correct schema, but it appears it was never properly applied to the database.

### Issue 2: Redis API Version Mismatch
The cache module was using the old Redis v3 API (`redis.setex()`), but the project uses Redis v4+ which has a different API (`redis.setEx()` with capital E).

## Solution

### Fix 1: Database Schema Migration
Created and ran `/workspaces/pocketbizz/fix-stock-movements-schema.js` to:

1. ✅ Create `stock_movement_type` enum if not exists
2. ✅ Rename `type` column to `movement_type_old`
3. ✅ Add new `movement_type` column (stock_movement_type enum)
4. ✅ Add `quantity_before` column (numeric)
5. ✅ Add `quantity_change` column (numeric)
6. ✅ Add `quantity_after` column (numeric)
7. ✅ Add `reason` column (text)
8. ✅ Add `created_by` column (varchar)
9. ✅ Migrate existing data from old schema to new schema
10. ✅ Set `movement_type` to NOT NULL
11. ✅ Drop deprecated columns (`quantity`, `unit_cost`, `movement_type_old`)
12. ✅ Add foreign key constraint for `created_by`

**Final Schema:**
```sql
stock_movements
  - id (varchar, PK)
  - user_id (varchar, FK → users.id)
  - stock_item_id (varchar, FK → stock_items.id)
  - movement_type (stock_movement_type enum) NOT NULL
  - quantity_before (numeric(10,2)) NOT NULL
  - quantity_change (numeric(10,2)) NOT NULL
  - quantity_after (numeric(10,2)) NOT NULL
  - reason (text)
  - reference_id (varchar)
  - reference_type (text)
  - notes (text)
  - created_by (varchar, FK → users.id)
  - created_at (timestamp) NOT NULL
```

### Fix 2: Redis API Update
Updated `/workspaces/pocketbizz/server/cache.ts`:
- Changed `redis.setex()` to `redis.setEx()` (capital E for Redis v4+ compatibility)

## Files Modified

1. **Created:** `/workspaces/pocketbizz/fix-stock-movements-schema.js`
   - Migration script to update stock_movements table

2. **Modified:** `/workspaces/pocketbizz/server/cache.ts`
   - Line 94: `redis.setex()` → `redis.setEx()`

## Testing Required

After restarting the server, please test:

1. ✅ Creating new stock items (should now work)
2. ✅ Updating stock quantities
3. ✅ Viewing stock movement history
4. ✅ Production planning (which uses stock movements)
5. ✅ Stock replenishment
6. ✅ Redis caching (check logs for cache SET operations)

## Notes

- The server needs to be restarted to pick up the Redis cache fix
- All existing stock movements data has been preserved and migrated
- The migration script is idempotent (can be run multiple times safely)
- Consider adding the migration to your deployment pipeline for other environments

## Next Steps

1. Restart the development server
2. Test stock creation functionality
3. Monitor logs for any remaining errors
4. If deploying to production, ensure this migration runs before deploying the code changes
