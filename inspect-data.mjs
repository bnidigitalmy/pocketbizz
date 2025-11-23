#!/usr/bin/env node
/**
 * Quick Database Inspector for Manual Testing
 * Use this to verify data during UI testing
 */

import { drizzle } from 'drizzle-orm/neon-serverless';
import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';
import { config } from 'dotenv';
import { 
  vendors, 
  deliveries, 
  deliveryItems,
  vendorStockBalance,
  vendorClaims,
  vendorSales 
} from './shared/schema.js';
import { desc } from 'drizzle-orm';

config();

neonConfig.webSocketConstructor = ws;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool);

console.log('\n🔍 VENDOR SYSTEM DATA INSPECTOR\n');
console.log('═'.repeat(60));

const args = process.argv.slice(2);
const command = args[0] || 'summary';

async function showSummary() {
  console.log('\n📊 SYSTEM SUMMARY\n');
  
  const vendorCount = await db.select().from(vendors);
  const deliveryCount = await db.select().from(deliveries);
  const claimCount = await db.select().from(vendorClaims);
  const stockCount = await db.select().from(vendorStockBalance);
  
  console.log(`Total Vendors:        ${vendorCount.length}`);
  console.log(`Total Deliveries:     ${deliveryCount.length}`);
  console.log(`Total Claims:         ${claimCount.length}`);
  console.log(`Stock Balance Items:  ${stockCount.length}`);
}

async function showLatestDeliveries() {
  console.log('\n📦 LATEST 5 DELIVERIES\n');
  
  const latest = await db
    .select()
    .from(deliveries)
    .orderBy(desc(deliveries.createdAt))
    .limit(5);
  
  if (latest.length === 0) {
    console.log('   No deliveries found.');
    return;
  }
  
  latest.forEach((d, i) => {
    console.log(`${i + 1}. ${d.invoiceNumber || 'N/A'}`);
    console.log(`   Vendor: ${d.vendorName}`);
    console.log(`   Date: ${d.deliveryDate}`);
    console.log(`   Amount: RM ${d.totalAmount}`);
    console.log(`   Created: ${d.createdAt.toISOString()}`);
    console.log('');
  });
}

async function showStockBalance() {
  console.log('\n📊 VENDOR STOCK BALANCE (All Items)\n');
  
  const stocks = await db
    .select()
    .from(vendorStockBalance)
    .orderBy(desc(vendorStockBalance.updatedAt));
  
  if (stocks.length === 0) {
    console.log('   No stock balance records found.');
    console.log('   ⚠️  This means deliveries are not updating stock!');
    return;
  }
  
  stocks.forEach((s, i) => {
    console.log(`${i + 1}. Vendor ID: ${s.vendorId}`);
    console.log(`   Product ID: ${s.productId}`);
    console.log(`   Current Stock: ${s.currentStock} units`);
    console.log(`   Last Delivery: ${s.lastDeliveryDate || 'Never'}`);
    console.log(`   Last Sale: ${s.lastSaleDate || 'Never'}`);
    console.log(`   Updated: ${s.updatedAt.toISOString()}`);
    console.log('');
  });
}

async function showLatestClaims() {
  console.log('\n📋 LATEST 5 VENDOR CLAIMS\n');
  
  const claims = await db
    .select()
    .from(vendorClaims)
    .orderBy(desc(vendorClaims.createdAt))
    .limit(5);
  
  if (claims.length === 0) {
    console.log('   No claims found.');
    return;
  }
  
  claims.forEach((c, i) => {
    console.log(`${i + 1}. ${c.claimNumber}`);
    console.log(`   Vendor: ${c.vendorName}`);
    console.log(`   Status: ${c.status}`);
    console.log(`   Amount: RM ${c.totalClaimAmount}`);
    console.log(`   Date: ${c.claimDate}`);
    console.log(`   User ID: ${c.userId.substring(0, 8)}...`);
    console.log('');
  });
}

async function showDeliveryItems(invoiceNumber) {
  console.log(`\n📦 DELIVERY ITEMS FOR: ${invoiceNumber}\n`);
  
  const [delivery] = await db
    .select()
    .from(deliveries)
    .where(deliveries.invoiceNumber === invoiceNumber);
  
  if (!delivery) {
    console.log('   Delivery not found.');
    return;
  }
  
  const items = await db
    .select()
    .from(deliveryItems)
    .where(deliveryItems.deliveryId === delivery.id);
  
  items.forEach((item, i) => {
    console.log(`${i + 1}. ${item.productName}`);
    console.log(`   Quantity: ${item.quantity}`);
    console.log(`   Unit Price: RM ${item.unitPrice}`);
    console.log(`   Total: RM ${item.totalPrice}`);
    if (item.rejectedQty > 0) {
      console.log(`   ⚠️  Rejected: ${item.rejectedQty} (${item.rejectionReason || 'N/A'})`);
    }
    console.log('');
  });
}

// Command router
try {
  switch (command) {
    case 'summary':
      await showSummary();
      break;
    case 'deliveries':
      await showLatestDeliveries();
      break;
    case 'stock':
      await showStockBalance();
      break;
    case 'claims':
      await showLatestClaims();
      break;
    case 'items':
      if (!args[1]) {
        console.log('\n❌ Usage: node inspect-data.mjs items <invoice-number>');
        console.log('   Example: node inspect-data.mjs items INV-20251113-0001\n');
      } else {
        await showDeliveryItems(args[1]);
      }
      break;
    case 'help':
      console.log('\n📖 USAGE:\n');
      console.log('   node inspect-data.mjs [command] [args]');
      console.log('');
      console.log('COMMANDS:');
      console.log('   summary              Show system overview (default)');
      console.log('   deliveries           Show latest 5 deliveries');
      console.log('   stock                Show all vendor stock balances');
      console.log('   claims               Show latest 5 claims');
      console.log('   items <invoice-no>   Show items for specific delivery');
      console.log('   help                 Show this help message');
      console.log('');
      console.log('EXAMPLES:');
      console.log('   node inspect-data.mjs');
      console.log('   node inspect-data.mjs stock');
      console.log('   node inspect-data.mjs items INV-20251113-0001');
      console.log('');
      break;
    default:
      console.log(`\n❌ Unknown command: ${command}`);
      console.log('   Run: node inspect-data.mjs help\n');
  }
} catch (error) {
  console.error('\n❌ Error:', error.message);
  console.error(error);
} finally {
  await pool.end();
  console.log('═'.repeat(60));
  console.log('');
}
