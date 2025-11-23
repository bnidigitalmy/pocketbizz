import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

dotenv.config();

async function checkAdmin() {
  try {
    const sql = neon(process.env.DATABASE_URL);
    
    // Check admin account
    const adminUser = await sql`
      SELECT id, email, name, is_admin, suspended, is_on_trial 
      FROM users 
      WHERE email = 'admin@pocketbizz.my'
    `;
    
    if (adminUser.length === 0) {
      console.log('❌ Admin account NOT FOUND');
      return;
    }
    
    console.log('✅ Admin account found:');
    console.log('   Email:', adminUser[0].email);
    console.log('   Name:', adminUser[0].name);
    console.log('   Is Admin:', adminUser[0].is_admin === 1 ? 'YES ✅' : 'NO ❌');
    console.log('   Suspended:', adminUser[0].suspended === 1 ? 'YES ❌' : 'NO ✅');
    console.log('   On Trial:', adminUser[0].is_on_trial === 1 ? 'YES' : 'NO');
    console.log('');
    
    // Count all users
    const allUsers = await sql`SELECT COUNT(*) as total FROM users`;
    console.log('📊 Total users in database:', allUsers[0].total);
    
    // List all users
    const usersList = await sql`
      SELECT email, name, is_admin, suspended 
      FROM users 
      ORDER BY created_at DESC 
      LIMIT 10
    `;
    
    console.log('\n📋 Last 10 users:');
    usersList.forEach((user, i) => {
      console.log(`   ${i+1}. ${user.email} - ${user.name} ${user.is_admin === 1 ? '(ADMIN)' : ''} ${user.suspended === 1 ? '(SUSPENDED)' : ''}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
  
  process.exit(0);
}

checkAdmin();
