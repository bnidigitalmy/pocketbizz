import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { sql } from 'drizzle-orm';
import dotenv from 'dotenv';

dotenv.config();

const queryClient = neon(process.env.DATABASE_URL);
const db = drizzle(queryClient);

const result = await db.execute(sql`
  SELECT id, slug, business_name, is_active, whatsapp_number 
  FROM store_settings 
  LIMIT 5
`);

console.log('\n📊 Store Settings in Database:');
console.table(result.rows);

if (result.rows.length > 0) {
  const store = result.rows[0];
  console.log(`\n✅ Store found!`);
  console.log(`   Slug: ${store.slug}`);
  console.log(`   Business: ${store.business_name}`);
  console.log(`   Active: ${store.is_active === 1 ? 'Yes' : 'No'}`);
  console.log(`   WhatsApp: ${store.whatsapp_number}`);
  console.log(`\n🔗 Public URL: http://localhost:5000/store/${store.slug}`);
} else {
  console.log('\n⚠️  No store settings found. Please create one in /store-catalog');
}
