import 'dotenv/config';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

try {
  const cols = await sql`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'stock_movements' 
    ORDER BY ordinal_position
  `;
  
  console.log('stock_movements table columns:');
  cols.forEach(c => console.log(`  - ${c.column_name} (${c.data_type})`));
  
  if (cols.length === 0) {
    console.log('❌ Table stock_movements does not exist!');
  }
} catch (error) {
  console.error('Error:', error.message);
}
