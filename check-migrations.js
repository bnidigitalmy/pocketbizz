import 'dotenv/config';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

try {
  const migrations = await sql`
    SELECT * FROM drizzle.__drizzle_migrations 
    ORDER BY created_at DESC
  `;
  
  console.log('Applied migrations:');
  migrations.forEach(m => console.log(`  - ${m.hash} (${m.created_at})`));
} catch (error) {
  console.error('Error:', error.message);
}
