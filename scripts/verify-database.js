#!/usr/bin/env node

/**
 * Database Verification Script
 * Checks database health and verifies critical tables exist
 */

import pg from 'pg';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const { Pool } = pg;
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is not set');
  process.exit(1);
}

const pool = new Pool({
  connectionString: DATABASE_URL,
});

async function verifyDatabase() {
  console.log('🔍 Verifying database health...\n');

  try {
    // Test connection
    console.log('1️⃣ Testing database connection...');
    await pool.query('SELECT 1');
    console.log('   ✓ Connection successful\n');

    // Check critical tables
    console.log('2️⃣ Checking critical tables...');
    const tables = [
      'users',
      'products',
      'sales',
      'sales_items',
      'vendors',
      'deliveries',
      'delivery_items',
    ];

    for (const table of tables) {
      try {
        const result = await pool.query(`SELECT COUNT(*) FROM ${table}`);
        const count = parseInt(result.rows[0].count);
        console.log(`   ✓ ${table.padEnd(20)} - ${count} rows`);
      } catch (error) {
        console.log(`   ❌ ${table.padEnd(20)} - ERROR: ${error.message}`);
      }
    }

    // Check database size
    console.log('\n3️⃣ Database statistics...');
    const sizeResult = await pool.query(`
      SELECT 
        pg_size_pretty(pg_database_size(current_database())) as size
    `);
    console.log(`   📊 Database size: ${sizeResult.rows[0].size}`);

    // Check last activity
    const activityResult = await pool.query(`
      SELECT 
        (SELECT MAX(created_at) FROM users) as last_user,
        (SELECT MAX(created_at) FROM sales) as last_sale,
        (SELECT MAX(created_at) FROM deliveries) as last_delivery
    `);
    const activity = activityResult.rows[0];
    console.log(`   🕐 Last user created: ${activity.last_user || 'N/A'}`);
    console.log(`   🕐 Last sale: ${activity.last_sale || 'N/A'}`);
    console.log(`   🕐 Last delivery: ${activity.last_delivery || 'N/A'}`);

    console.log('\n✅ Database verification completed successfully!');

  } catch (error) {
    console.error('\n❌ Database verification failed:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run verification
verifyDatabase()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
