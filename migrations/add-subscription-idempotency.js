/**
 * Migration: Add Subscription Idempotency and Billing Audit
 * 
 * This migration adds:
 * 1. Unique constraint on userSubscriptions.externalTransactionId
 * 2. Indexes for performance
 * 3. New fields: activationSource, previousSubscriptionId
 * 
 * Run: node migrations/add-subscription-idempotency.js
 */

import { db } from '../server/db.js';
import { sql } from 'drizzle-orm';

async function runMigration() {
  console.log('🔄 Starting migration: Add Subscription Idempotency and Billing Audit');
  
  try {
    // 1. Add new columns to user_subscriptions
    console.log('Adding new columns to user_subscriptions...');
    
    await db.execute(sql`
      ALTER TABLE user_subscriptions 
      ADD COLUMN IF NOT EXISTS activation_source TEXT DEFAULT 'webhook_bcl'
    `);
    
    await db.execute(sql`
      ALTER TABLE user_subscriptions 
      ADD COLUMN IF NOT EXISTS previous_subscription_id VARCHAR
    `);
    
    console.log('✓ New columns added');

    // 2. Create unique constraint on external_transaction_id (handle NULL values)
    console.log('Creating unique constraint on external_transaction_id...');
    
    // First, handle existing NULL values (add unique placeholder)
    await db.execute(sql`
      UPDATE user_subscriptions 
      SET external_transaction_id = 'LEGACY-' || id 
      WHERE external_transaction_id IS NULL
    `);
    
    // Now create unique constraint
    await db.execute(sql`
      ALTER TABLE user_subscriptions 
      ADD CONSTRAINT unique_external_transaction_id 
      UNIQUE (external_transaction_id)
    `);
    
    console.log('✓ Unique constraint created');

    // 3. Create indexes for performance
    console.log('Creating performance indexes...');
    
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS user_subscriptions_user_id_idx 
      ON user_subscriptions(user_id)
    `);
    
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS user_subscriptions_status_idx 
      ON user_subscriptions(status)
    `);
    
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS user_subscriptions_external_tx_idx 
      ON user_subscriptions(external_transaction_id)
    `);
    
    console.log('✓ Indexes created');

    // 4. Verify migration
    console.log('Verifying migration...');
    
    const result = await db.execute(sql`
      SELECT 
        column_name, 
        data_type, 
        is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'user_subscriptions' 
      AND column_name IN ('activation_source', 'previous_subscription_id', 'external_transaction_id')
      ORDER BY column_name
    `);
    
    console.log('✓ Migration verified. Columns:');
    console.table(result.rows);

    console.log('\n✅ Migration completed successfully!');
    console.log('\nNext steps:');
    console.log('1. Deploy updated code to production');
    console.log('2. Test webhook with duplicate transaction IDs');
    console.log('3. Monitor logs for idempotency messages');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    console.error('\nRollback instructions:');
    console.log('1. DROP CONSTRAINT unique_external_transaction_id');
    console.log('2. DROP INDEX user_subscriptions_user_id_idx');
    console.log('3. DROP INDEX user_subscriptions_status_idx');
    console.log('4. DROP INDEX user_subscriptions_external_tx_idx');
    console.log('5. ALTER TABLE user_subscriptions DROP COLUMN activation_source');
    console.log('6. ALTER TABLE user_subscriptions DROP COLUMN previous_subscription_id');
    throw error;
  }
}

// Run migration
runMigration()
  .then(() => {
    console.log('Migration script finished');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration script failed:', error);
    process.exit(1);
  });
