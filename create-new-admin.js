import { neon } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

async function createNewAdmin() {
  try {
    const sql = neon(process.env.DATABASE_URL);
    
    const email = 'admin@pocketbizz.my';
    const password = 'Bani@#243643';
    const name = 'PocketBizz Admin';
    
    // Check if admin already exists
    const existingUser = await sql`
      SELECT id, email, is_admin FROM users WHERE email = ${email}
    `;
    
    if (existingUser.length > 0) {
      if (existingUser[0].is_admin === 1) {
        console.log('✅ Admin user already exists with this email');
        console.log('   Email:', email);
        console.log('   Admin status: Yes');
        return;
      } else {
        // Update existing user to admin
        await sql`
          UPDATE users 
          SET is_admin = 1, updated_at = NOW()
          WHERE email = ${email}
        `;
        console.log('✅ Existing user promoted to admin');
        console.log('   Email:', email);
        return;
      }
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);
    
    // Calculate trial end date (7 days from now)
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 7);
    
    // Insert admin user
    const result = await sql`
      INSERT INTO users (
        email, 
        password, 
        name, 
        is_admin, 
        is_on_trial, 
        trial_ends_at,
        suspended,
        created_at, 
        updated_at
      ) VALUES (
        ${email},
        ${hashedPassword},
        ${name},
        1,
        1,
        ${trialEndsAt.toISOString()},
        0,
        NOW(),
        NOW()
      )
      RETURNING id, email, name, is_admin
    `;
    
    console.log('✅ Admin user created successfully!');
    console.log('   Email:', email);
    console.log('   Password:', password);
    console.log('   Name:', name);
    console.log('   Admin: Yes');
    console.log('');
    console.log('🔐 You can now login with these credentials');
    
  } catch (error) {
    console.error('❌ Error creating admin user:', error.message);
    process.exit(1);
  }
  
  process.exit(0);
}

createNewAdmin();
