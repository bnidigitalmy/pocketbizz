import pg from 'pg';
const { Client } = pg;

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function migrateKreditToQr() {
  try {
    await client.connect();
    console.log('Connected to database');

    // Update all "kredit" to "qr" in sales table
    const salesResult = await client.query(
      "UPDATE sales SET payment_method = 'qr' WHERE payment_method = 'kredit'"
    );
    console.log(`✅ Updated ${salesResult.rowCount} rows in sales table`);

    console.log('✅ Migration complete! All "kredit" values changed to "qr"');
  } catch (error) {
    console.error('Migration error:', error);
  } finally {
    await client.end();
  }
}

migrateKreditToQr();
