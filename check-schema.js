import 'dotenv/config';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

const cols = await sql`
  SELECT column_name, data_type 
  FROM information_schema.columns 
  WHERE table_name = 'users' 
  ORDER BY ordinal_position
`;

console.log('Users table columns:');
cols.forEach(c => console.log(`  - ${c.column_name} (${c.data_type})`));
