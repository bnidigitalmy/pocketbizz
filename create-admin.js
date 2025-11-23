import 'dotenv/config';
import { neon } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';

const sql = neon(process.env.DATABASE_URL);

async function createAdminUser() {
  try {
    console.log('🔐 Creating admin user...\n');
    
    const username = 'admin';
    const email = 'admin@fiqbakery.com';
    const password = 'Admin@123456'; // Change this in production!
    
    // Hash password with bcrypt cost factor 12 (as per security implementation)
    const passwordHash = await bcrypt.hash(password, 12);
    
    // Insert admin user using raw SQL with correct schema
    const [newUser] = await sql`
      INSERT INTO users (
        id,
        email, 
        password, 
        name, 
        business_name, 
        phone, 
        is_admin,
        is_on_trial,
        trial_ends_at,
        created_at
      ) VALUES (
        gen_random_uuid()::text,
        ${email},
        ${passwordHash},
        'FIQ Sweet Bakery Admin',
        'FIQ Sweet Bakery',
        '+60123456789',
        1,
        0,
        NULL,
        NOW()
      )
      RETURNING *
    `;
    
    console.log('✅ Admin user created successfully!\n');
    console.log('📋 Login Credentials:');
    console.log('   Username:', username);
    console.log('   Password:', password);
    console.log('   Email:', email);
    console.log('   User ID:', newUser.id);
    console.log('\n⚠️  IMPORTANT: Change password after first login!\n');
    console.log('🌐 Login at: http://localhost:5000/auth/login\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin user:', error.message);
    if (error.message.includes('unique')) {
      console.log('\n💡 Admin user already exists. Use these credentials:');
      console.log('   Username: admin');
      console.log('   Password: Admin@123456');
    }
    process.exit(1);
  }
}

createAdminUser();
