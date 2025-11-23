import { sql } from '@vercel/postgres';
import * as fs from 'fs';

const migrationSQL = fs.readFileSync('./migrations/0002_third_fat_cobra.sql', 'utf8');

async function applyMigration() {
  try {
    console.log('Applying migration 0002_third_fat_cobra.sql...');
    await sql.query(migrationSQL);
    console.log('✅ Migration applied successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
  }
}

applyMigration();
