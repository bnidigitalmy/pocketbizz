#!/usr/bin/env node
/**
 * Vendor System - Code Verification Test
 * Quick verification that all fixes are present in the code
 */

import { readFileSync } from 'fs';

console.log('🔍 Vendor System Code Verification\n');
console.log('═'.repeat(60));

const storageCode = readFileSync('./server/storage.ts', 'utf-8');

const tests = [
  {
    name: 'Bug #1: Stock Balance Update in createDelivery',
    check: () => {
      const createDeliveryStart = storageCode.indexOf('async createDelivery(');
      const nextFunction = storageCode.indexOf('async updateDeliveryStatus', createDeliveryStart);
      const functionBody = storageCode.slice(createDeliveryStart, nextFunction);
      
      return functionBody.includes('updateStockBalance') && 
             functionBody.includes('delivered: item.quantity');
    }
  },
  {
    name: 'Bug #2: Vendor Sales Stock Update (Pre-existing)',
    check: () => {
      const createVendorSaleStart = storageCode.indexOf('async createVendorSale(');
      const nextFunction = storageCode.indexOf('async getVendorSales', createVendorSaleStart);
      const functionBody = storageCode.slice(createVendorSaleStart, nextFunction);
      
      return functionBody.includes('updateStockBalance') && 
             functionBody.includes('sold: sale.quantitySold');
    }
  },
  {
    name: 'Bug #3: Transaction Wrapper in updateDeliveryItemRejection',
    check: () => {
      const funcStart = storageCode.indexOf('async updateDeliveryItemRejection(');
      const nextFunction = storageCode.indexOf('async generateReceiptNumber', funcStart);
      const functionBody = storageCode.slice(funcStart, nextFunction);
      
      return functionBody.includes('return await db.transaction(async (tx)') &&
             functionBody.includes('await tx.select()') &&
             functionBody.includes('await tx.update(deliveryItems)');
    }
  },
  {
    name: 'Bug #4: User-Scoped generateClaimNumber',
    check: () => {
      // Check interface
      const interfaceCheck = storageCode.includes('generateClaimNumber(userId: string): Promise<string>');
      
      // Check implementation
      const funcStart = storageCode.indexOf('async generateClaimNumber(userId: string)');
      if (funcStart === -1) return false;
      
      const nextFunction = storageCode.indexOf('async createVendorClaim', funcStart);
      const functionBody = storageCode.slice(funcStart, nextFunction);
      
      return interfaceCheck && 
             functionBody.includes('eq(vendorClaims.userId, userId)') &&
             functionBody.includes('and(');
    }
  }
];

let passed = 0;
const results = [];

tests.forEach((test, index) => {
  try {
    const result = test.check();
    const status = result ? '✅ PASS' : '❌ FAIL';
    results.push({ name: test.name, status, passed: result });
    if (result) passed++;
    
    console.log(`\n${index + 1}. ${status}: ${test.name}`);
  } catch (error) {
    console.log(`\n${index + 1}. ❌ ERROR: ${test.name}`);
    console.log(`   ${error.message}`);
    results.push({ name: test.name, status: '❌ ERROR', passed: false });
  }
});

console.log('\n' + '═'.repeat(60));
console.log(`\n📊 Verification Results:`);
console.log(`   ✅ Passed: ${passed}/${tests.length}`);
console.log(`   ❌ Failed: ${tests.length - passed}/${tests.length}`);
console.log(`   Success Rate: ${Math.round((passed / tests.length) * 100)}%\n`);

if (passed === tests.length) {
  console.log('🎉 All fixes verified! Code is ready for testing.\n');
  
  console.log('📝 Summary of Implemented Fixes:');
  console.log('   1. ✅ Stock balance auto-updates on delivery creation');
  console.log('   2. ✅ Vendor sales already updating stock correctly');
  console.log('   3. ✅ Rejection updates wrapped in transactions');
  console.log('   4. ✅ Claim numbers are user-scoped\n');
  
  console.log('🚀 Next Steps:');
  console.log('   • Start dev server: npm run dev');
  console.log('   • Test delivery creation in UI');
  console.log('   • Verify stock balance updates');
  console.log('   • Test concurrent rejection updates');
  console.log('   • Create vendor claims and check numbering\n');
  
  process.exit(0);
} else {
  console.log('⚠️  Some verifications failed. Review the code.\n');
  process.exit(1);
}
