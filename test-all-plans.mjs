/**
 * Comprehensive Pricing Test - All Plans
 * 
 * Tests all 4 pricing tiers:
 * 1. Trial (RM0) - 10 products, 2 vendors, 0 resellers, no premium features
 * 2. Basic (RM39) - 50 products, 5 vendors, 0 resellers, no premium features
 * 3. Pro (RM89) - 200 products, 20 vendors, 10 resellers, all features except custom domain
 * 4. Premium (RM159) - Unlimited everything, all features
 */

import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5000';
const DB_URL = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_L5WwFvCEJuDR@ep-dry-silence-a1d5yh70.ap-southeast-1.aws.neon.tech/neondb?sslmode=require';

let sessionCookie = '';
let userId = '';

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

// Helper: Login as user
async function login(email, password) {
  const response = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  
  const setCookie = response.headers.get('set-cookie');
  if (setCookie) {
    sessionCookie = setCookie.split(';')[0];
  }
  
  const data = await response.json();
  if (response.ok) {
    userId = data.user.id;
  }
  
  return { success: response.ok, data };
}

// Helper: Create user and assign subscription via direct DB update using SQL
async function createUserWithPlan(planName, email) {
  console.log(`\n📝 Creating user with ${planName} plan...`);
  
  // Register user first
  const response = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: `${planName} Test User`,
      email: email,
      password: 'Test123!@#',
      businessName: `${planName} Test Business`
    }),
  });
  
  const setCookie = response.headers.get('set-cookie');
  if (setCookie) {
    sessionCookie = setCookie.split(';')[0];
  }
  
  const data = await response.json();
  
  if (!response.ok) {
    console.log(`❌ Registration failed: ${data.message}`);
    return null;
  }
  
  userId = data.user.id;
  console.log(`   ✅ User registered: ${email}`);
  
  // If not trial, need to create subscription via SQL
  if (planName !== 'trial') {
    // Use internal API to create subscription (you'll need to add this endpoint)
    // OR just test what we have - Trial user behavior
    console.log(`   ⚠️  Note: Testing with Trial limits. To test paid plans, manually create subscription in DB.`);
  }
  
  return { userId, planName: planName.charAt(0).toUpperCase() + planName.slice(1) };
}

// Test: Check usage stats
async function testUsageStats(expectedPlan) {
  const response = await authFetch('/api/subscription/usage');
  const data = await response.json();
  
  if (response.ok) {
    console.log(`   Plan: ${data.plan}`);
    console.log(`   Products: ${data.usage.products.current}/${data.usage.products.limit}`);
    console.log(`   Vendors: ${data.usage.vendors.current}/${data.usage.vendors.limit}`);
    console.log(`   Resellers: ${data.usage.resellers.current}/${data.usage.resellers.limit}`);
    console.log(`   Stock: ${data.usage.stockItems.current}/${data.usage.stockItems.limit}`);
    return data;
  } else {
    console.log(`   ❌ Failed to get usage stats`);
    return null;
  }
}

// Test: Try to access premium feature
async function testPremiumFeature(featureName, endpoint) {
  const response = await authFetch(endpoint);
  const data = await response.json();
  
  if (response.status === 403) {
    console.log(`   🚫 ${featureName}: BLOCKED (${data.message})`);
    return false; // Feature blocked
  } else if (response.ok) {
    console.log(`   ✅ ${featureName}: GRANTED`);
    return true; // Feature granted
  } else {
    console.log(`   ⚠️  ${featureName}: Unexpected (${response.status})`);
    return null;
  }
}

// Test each plan
async function testPlan(planName, email) {
  console.log('\n' + '═'.repeat(60));
  console.log(`  TESTING: ${planName.toUpperCase()} PLAN`);
  console.log('═'.repeat(60));
  
  // Create user with plan
  const user = await createUserWithPlan(planName, email);
  if (!user) return;
  
  // Test 1: Usage stats
  console.log(`\n📊 Usage Stats:`);
  const stats = await testUsageStats(user.planName);
  
  // Test 2: Premium features
  console.log(`\n🔒 Premium Features:`);
  const vendorClaims = await testPremiumFeature('Vendor Claims', '/api/vendor-claims');
  const resellerNetwork = await testPremiumFeature('Reseller Network', '/api/resellers');
  const analytics = await testPremiumFeature('Advanced Analytics', '/api/analytics/product-performance');
  
  // Expected results based on plan
  const expected = {
    trial: {
      products: 10,
      vendors: 2,
      resellers: 0,
      vendorClaims: false,
      resellerNetwork: false,
      analytics: false,
    },
    basic: {
      products: 50,
      vendors: 5,
      resellers: 0,
      vendorClaims: false,
      resellerNetwork: false,
      analytics: false,
    },
    pro: {
      products: 200,
      vendors: 20,
      resellers: 10,
      vendorClaims: true,
      resellerNetwork: true,
      analytics: true,
    },
    premium: {
      products: 999999, // Unlimited
      vendors: 999999,
      resellers: 999999,
      vendorClaims: true,
      resellerNetwork: true,
      analytics: true,
    }
  };
  
  const exp = expected[planName];
  
  // Verify results
  console.log(`\n📋 Verification:`);
  let allPassed = true;
  
  if (stats) {
    const productsMatch = stats.usage.products.limit === exp.products;
    const vendorsMatch = stats.usage.vendors.limit === exp.vendors;
    const resellersMatch = stats.usage.resellers.limit === exp.resellers;
    
    console.log(`   Products limit: ${stats.usage.products.limit} ${productsMatch ? '✅' : '❌ Expected: ' + exp.products}`);
    console.log(`   Vendors limit: ${stats.usage.vendors.limit} ${vendorsMatch ? '✅' : '❌ Expected: ' + exp.vendors}`);
    console.log(`   Resellers limit: ${stats.usage.resellers.limit} ${resellersMatch ? '✅' : '❌ Expected: ' + exp.resellers}`);
    
    allPassed = allPassed && productsMatch && vendorsMatch && resellersMatch;
  }
  
  const vendorClaimsMatch = vendorClaims === exp.vendorClaims;
  const resellerNetworkMatch = resellerNetwork === exp.resellerNetwork;
  const analyticsMatch = analytics === exp.analytics;
  
  console.log(`   Vendor Claims: ${vendorClaims ? 'Granted' : 'Blocked'} ${vendorClaimsMatch ? '✅' : '❌ Expected: ' + (exp.vendorClaims ? 'Granted' : 'Blocked')}`);
  console.log(`   Reseller Network: ${resellerNetwork ? 'Granted' : 'Blocked'} ${resellerNetworkMatch ? '✅' : '❌ Expected: ' + (exp.resellerNetwork ? 'Granted' : 'Blocked')}`);
  console.log(`   Advanced Analytics: ${analytics ? 'Granted' : 'Blocked'} ${analyticsMatch ? '✅' : '❌ Expected: ' + (exp.analytics ? 'Granted' : 'Blocked')}`);
  
  allPassed = allPassed && vendorClaimsMatch && resellerNetworkMatch && analyticsMatch;
  
  if (allPassed) {
    console.log(`\n   🎉 ${planName.toUpperCase()}: ALL TESTS PASSED!`);
  } else {
    console.log(`\n   ❌ ${planName.toUpperCase()}: SOME TESTS FAILED`);
  }
  
  return allPassed;
}

// Run all tests
async function runAllTests() {
  console.log('\n');
  console.log('═'.repeat(60));
  console.log('  POCKETBIZZ PRICING - COMPREHENSIVE PLAN TESTING');
  console.log('═'.repeat(60));
  
  try {
    const results = {
      trial: await testPlan('trial', 'trial-user@test.com'),
      basic: await testPlan('basic', 'basic-user@test.com'),
      pro: await testPlan('pro', 'pro-user@test.com'),
      premium: await testPlan('premium', 'premium-user@test.com'),
    };
    
    // Final summary
    console.log('\n' + '═'.repeat(60));
    console.log('  FINAL SUMMARY');
    console.log('═'.repeat(60));
    
    Object.entries(results).forEach(([plan, passed]) => {
      const icon = passed ? '✅' : '❌';
      console.log(`${icon} ${plan.toUpperCase().padEnd(10)} - ${passed ? 'PASSED' : 'FAILED'}`);
    });
    
    const allPassed = Object.values(results).every(r => r);
    
    if (allPassed) {
      console.log('\n🎉 ALL PLANS TESTED SUCCESSFULLY! 🎉\n');
    } else {
      console.log('\n⚠️  SOME TESTS FAILED - CHECK DETAILS ABOVE\n');
    }
    
    process.exit(allPassed ? 0 : 1);
    
  } catch (error) {
    console.error('\n❌ Test failed with error:', error);
    process.exit(1);
  }
}

// Run tests
runAllTests();
