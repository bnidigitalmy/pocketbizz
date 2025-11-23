import 'dotenv/config';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

console.log('🔧 Fixing stock_movements table schema...');

try {
  // Check current schema
  const currentCols = await sql`
    SELECT column_name 
    FROM information_schema.columns 
    WHERE table_name = 'stock_movements'
  `;
  
  console.log('Current columns:', currentCols.map(c => c.column_name).join(', '));
  
  // Apply the migration
  console.log('\n1. Creating stock_movement_type enum if not exists...');
  await sql`
    DO $$ BEGIN
      CREATE TYPE stock_movement_type AS ENUM(
        'purchase', 
        'replenish', 
        'adjust', 
        'production_use', 
        'waste', 
        'return', 
        'transfer', 
        'correction'
      );
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;
  `;
  
  const hasTypeCol = currentCols.some(c => c.column_name === 'type');
  const hasMovementTypeOldCol = currentCols.some(c => c.column_name === 'movement_type_old');
  const hasMovementTypeCol = currentCols.some(c => c.column_name === 'movement_type');
  
  if (hasTypeCol && !hasMovementTypeOldCol) {
    console.log('2. Renaming old column "type" to "movement_type_old"...');
    await sql`ALTER TABLE stock_movements RENAME COLUMN type TO movement_type_old`;
  } else {
    console.log('2. Column already renamed (skipping)');
  }
  
  if (!hasMovementTypeCol) {
    console.log('3. Adding new column movement_type...');
    await sql`ALTER TABLE stock_movements ADD COLUMN movement_type stock_movement_type`;
  } else {
    console.log('3. Column movement_type already exists (skipping)');
  }
  
  if (!currentCols.some(c => c.column_name === 'quantity_before')) {
    console.log('4. Adding quantity_before column...');
    await sql`ALTER TABLE stock_movements ADD COLUMN quantity_before numeric(10, 2) DEFAULT 0 NOT NULL`;
  }
  
  if (!currentCols.some(c => c.column_name === 'quantity_change')) {
    console.log('5. Adding quantity_change column...');
    await sql`ALTER TABLE stock_movements ADD COLUMN quantity_change numeric(10, 2) DEFAULT 0 NOT NULL`;
  }
  
  if (!currentCols.some(c => c.column_name === 'quantity_after')) {
    console.log('6. Adding quantity_after column...');
    await sql`ALTER TABLE stock_movements ADD COLUMN quantity_after numeric(10, 2) DEFAULT 0 NOT NULL`;
  }
  
  if (!currentCols.some(c => c.column_name === 'reason')) {
    console.log('7. Adding reason column...');
    await sql`ALTER TABLE stock_movements ADD COLUMN reason text`;
  }
  
  // Add created_by if it doesn't exist
  const hasCreatedBy = currentCols.some(c => c.column_name === 'created_by');
  if (!hasCreatedBy) {
    console.log('8. Adding created_by column...');
    await sql`ALTER TABLE stock_movements ADD COLUMN created_by varchar`;
  }
  
  console.log('9. Migrating data from old schema to new schema...');
  await sql`
    UPDATE stock_movements 
    SET 
      quantity_before = COALESCE(quantity, 0),
      quantity_change = COALESCE(quantity, 0),
      quantity_after = COALESCE(quantity, 0),
      movement_type = CASE 
        WHEN movement_type_old::text = ANY(ARRAY['purchase', 'replenish', 'adjust', 'production_use', 'waste', 'return', 'transfer', 'correction']) 
        THEN movement_type_old::text::stock_movement_type
        ELSE 'adjust'::stock_movement_type
      END,
      reason = COALESCE(notes, '')
    WHERE movement_type IS NULL
  `;
  
  console.log('10. Making movement_type NOT NULL...');
  await sql`ALTER TABLE stock_movements ALTER COLUMN movement_type SET NOT NULL`;
  
  console.log('11. Dropping old columns...');
  await sql`ALTER TABLE stock_movements DROP COLUMN IF EXISTS quantity`;
  await sql`ALTER TABLE stock_movements DROP COLUMN IF EXISTS unit_cost`;
  await sql`ALTER TABLE stock_movements DROP COLUMN IF EXISTS movement_type_old`;
  
  console.log('12. Adding foreign key constraint for created_by...');
  await sql`
    DO $$ BEGIN
      ALTER TABLE stock_movements 
      ADD CONSTRAINT stock_movements_created_by_users_id_fk 
      FOREIGN KEY (created_by) REFERENCES users(id);
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;
  `;
  
  console.log('\n✅ Schema migration completed successfully!');
  
  // Verify final schema
  const finalCols = await sql`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'stock_movements' 
    ORDER BY ordinal_position
  `;
  
  console.log('\nFinal schema:');
  finalCols.forEach(c => console.log(`  - ${c.column_name} (${c.data_type})`));
  
} catch (error) {
  console.error('\n❌ Error:', error.message);
  console.error(error);
  process.exit(1);
}

