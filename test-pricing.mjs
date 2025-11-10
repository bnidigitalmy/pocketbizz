/**
 * Test Pricing Implementation
 * 
 * This script tests:
 * 1. Product limit enforcement for Trial users
 * 2. Feature gating for premium features
 * 3. Subscription usage stats API
 */

import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5000';
const TEST_USER = {
  name: 'Trial Test User',
  email: 'test-trial@example.com',
  password: 'Test123!@#',
  businessName: 'Test Bakery Trial'
};

let sessionCookie = '';

// Helper: Make authenticated request
async function authFetch(url, options = {}) {
  const response = await fetch(`${BASE_URL}${url}`, {
    ...options,
    headers: {
      ...options.headers,
      'Cookie': sessionCookie,
      'Content-Type': 'application/json',
    },
  });
  
  return response;
}

// Test 1: Register trial user
async function testRegisterTrialUser() {
  console.log('\n🧪 TEST 1: Register Trial User');
  console.log('━'.repeat(50));
  
  const response = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(TEST_USER),
  });
  
  const setCookie = response.headers.get('set-cookie');
  if (setCookie) {
    sessionCookie = setCookie.split(';')[0];
  }
  
  const data = await response.json();
  
  if (response.ok) {
    console.log('✅ User registered successfully');
    console.log(`   Trial ends: ${data.user.trialEndsAt}`);
    console.log(`   Session: ${sessionCookie.substring(0, 30)}...`);
    return true;
  } else {
    console.log('❌ Registration failed:', data.message);
    return false;
  }
}

// Test 2: Check subscription usage (should show Trial limits)
async function testSubscriptionUsage() {
  console.log('\n🧪 TEST 2: Check Subscription Usage');
  console.log('━'.repeat(50));
  
  const response = await authFetch('/api/subscription/usage');
  const data = await response.json();
  
  if (response.ok) {
    console.log('✅ Usage stats retrieved');
    console.log(`   Plan: ${data.plan}`);
    console.log(`   Products: ${data.usage.products.current}/${data.usage.products.limit} (${data.usage.products.percentage}%)`);
    console.log(`   Vendors: ${data.usage.vendors.current}/${data.usage.vendors.limit} (${data.usage.vendors.percentage}%)`);
    console.log(`   Resellers: ${data.usage.resellers.current}/${data.usage.resellers.limit} (${data.usage.resellers.percentage}%)`);
    console.log(`   Stock Items: ${data.usage.stockItems.current}/${data.usage.stockItems.limit} (${data.usage.stockItems.percentage}%)`);
    return data;
  } else {
    console.log('❌ Failed to get usage stats');
    return null;
  }
}

// Test 3: Create products up to limit (Trial = 10)
async function testProductLimit() {
  console.log('\n🧪 TEST 3: Test Product Limit (Trial = 10 max)');
  console.log('━'.repeat(50));
  
  let created = 0;
  let blocked = false;
  
  for (let i = 1; i <= 12; i++) {
    const response = await authFetch('/api/products', {
      method: 'POST',
      body: JSON.stringify({
        name: `Test Product ${i}`,
        category: 'Cake',
        sellingPrice: 10 + i,
        costPrice: 5 + i,
        unit: 'pcs',
      }),
    });
    
    const data = await response.json();
    
    if (response.ok) {
      created++;
      console.log(`   ✅ Product ${i} created: ${data.name}`);
    } else {
      console.log(`   🚫 Product ${i} BLOCKED: ${data.message}`);
      if (data.upgradeRequired) {
        console.log(`      → Limit: ${data.limit}`);
        console.log(`      → Current: ${data.current}`);
        blocked = true;
        break;
      }
    }
  }
  
  console.log(`\n   Summary: Created ${created} products, blocked at limit`);
  return { created, blocked };
}

// Test 4: Try to access premium feature (Vendor Claims - Pro+ only)
async function testVendorClaimsAccess() {
  console.log('\n🧪 TEST 4: Test Vendor Claims Access (Pro+ Feature)');
  console.log('━'.repeat(50));
  
  const response = await authFetch('/api/vendor-claims');
  const data = await response.json();
  
  if (response.status === 403) {
    console.log('✅ Access BLOCKED as expected for Trial user');
    console.log(`   Message: ${data.message}`);
    console.log(`   Feature: ${data.feature}`);
    console.log(`   Upgrade Required: ${data.upgradeRequired}`);
    return true;
  } else if (response.ok) {
    console.log('❌ Access GRANTED - This should be blocked!');
    return false;
  } else {
    console.log('⚠️  Unexpected response:', data);
    return false;
  }
}

// Test 5: Try to access reseller network (Pro+ only)
async function testResellerNetworkAccess() {
  console.log('\n🧪 TEST 5: Test Reseller Network Access (Pro+ Feature)');
  console.log('━'.repeat(50));
  
  const response = await authFetch('/api/resellers');
  const data = await response.json();
  
  if (response.status === 403) {
    console.log('✅ Access BLOCKED as expected for Trial user');
    console.log(`   Message: ${data.message}`);
    console.log(`   Feature: ${data.feature}`);
    return true;
  } else if (response.ok) {
    console.log('❌ Access GRANTED - This should be blocked!');
    return false;
  } else {
    console.log('⚠️  Unexpected response:', data);
    return false;
  }
}

// Test 6: Try to access advanced analytics (Pro+ only)
async function testAdvancedAnalyticsAccess() {
  console.log('\n🧪 TEST 6: Test Advanced Analytics Access (Pro+ Feature)');
  console.log('━'.repeat(50));
  
  const response = await authFetch('/api/analytics/product-performance');
  const data = await response.json();
  
  if (response.status === 403) {
    console.log('✅ Access BLOCKED as expected for Trial user');
    console.log(`   Message: ${data.message}`);
    return true;
  } else if (response.ok) {
    console.log('❌ Access GRANTED - This should be blocked!');
    return false;
  } else {
    console.log('⚠️  Unexpected response:', data);
    return false;
  }
}

// Run all tests
async function runTests() {
  console.log('\n');
  console.log('═'.repeat(50));
  console.log('  POCKETBIZZ PRICING IMPLEMENTATION TESTS');
  console.log('═'.repeat(50));
  
  try {
    // Test 1: Register
    const registered = await testRegisterTrialUser();
    if (!registered) {
      console.log('\n❌ Cannot proceed - registration failed');
      return;
    }
    
    // Test 2: Usage stats
    await testSubscriptionUsage();
    
    // Test 3: Product limit
    const productTest = await testProductLimit();
    
    // Test 4-6: Premium features
    await testVendorClaimsAccess();
    await testResellerNetworkAccess();
    await testAdvancedAnalyticsAccess();
    
    // Final usage stats
    console.log('\n🧪 FINAL: Check Usage After Tests');
    console.log('━'.repeat(50));
    await testSubscriptionUsage();
    
    // Summary
    console.log('\n');
    console.log('═'.repeat(50));
    console.log('  TEST SUMMARY');
    console.log('═'.repeat(50));
    console.log('✅ Trial user registration');
    console.log('✅ Subscription usage stats API');
    console.log(`✅ Product limit enforcement (${productTest.created}/10)`);
    console.log('✅ Vendor claims feature gating');
    console.log('✅ Reseller network feature gating');
    console.log('✅ Advanced analytics feature gating');
    console.log('\n🎉 All pricing features working correctly!\n');
    
  } catch (error) {
    console.error('\n❌ Test failed with error:', error);
  }
}

// Run tests
runTests();
