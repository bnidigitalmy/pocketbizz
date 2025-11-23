import 'dotenv/config';
import { neon } from '@neondatabase/serverless';

async function verifyDatabase() {
  const sql = neon(process.env.DATABASE_URL);
  
  try {
    // Check connection
    const timeResult = await sql`SELECT NOW() as current_time`;
    console.log('✅ Database Connected:', timeResult[0].current_time);
    
    // Get all tables
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `;
    
    console.log('\n📊 DATABASE SUMMARY:');
    console.log('Total Tables:', tables.length);
    console.log('\n📋 Tables Created:');
    tables.forEach((t, i) => console.log(`  ${i + 1}. ${t.table_name}`));
    
    // Check users table specifically
    const userCount = await sql`SELECT COUNT(*) as count FROM users`;
    console.log('\n👥 Users table:', userCount[0].count, 'records');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Database Error:', error.message);
    process.exit(1);
  }
}

verifyDatabase();
