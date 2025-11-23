#!/usr/bin/env node

/**
 * Update Trial plan in production database
 * Sets Trial plan to inactive (hidden from pricing page)
 */

import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

const db = drizzle(pool);

(async () => {
  try {
    console.log('🔄 Updating Trial plan in database...\n');
    
    // Update Trial plan
    const updateResult = await pool.query(
      `UPDATE subscription_plans 
       SET is_active = 0, display_name = 'Free Trial' 
       WHERE name = 'trial'`
    );
    
    console.log(`✅ Trial plan updated (${updateResult.rowCount} row affected)\n`);
    
    // Show current plans
    const result = await pool.query(
      `SELECT name, display_name, is_active, sort_order 
       FROM subscription_plans 
       ORDER BY sort_order`
    );
    
    console.log('📋 Current Subscription Plans:');
    console.log('================================\n');
    result.rows.forEach(p => {
      const status = p.is_active ? '✅ Active (shown in pricing)' : '❌ Hidden';
      console.log(`${p.sort_order}. ${p.display_name.padEnd(20)} (${p.name.padEnd(10)}) - ${status}`);
    });
    console.log('\n✅ Update complete!\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
})();
