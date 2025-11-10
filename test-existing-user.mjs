/**
 * Quick test with existing logged-in user
 * Just check their subscription limits and feature access
 */
import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5000';

// You need to login via browser first, then copy session cookie here
const SESSION_COOKIE = 'connect.sid=s%3AyourSessionId.signature'; // Replace with actual cookie

async function testCurrentUser() {
  console.log('\n🧪 Testing Current Logged-In User\n');
  console.log('='repeat(50));
  
  // Test 1: Check who is logged in
  console.log('\n1️⃣  Checking current user...');
  const meRes = await fetch(`${BASE_URL}/api/auth/me`, {
    headers: { 'Cookie': SESSION_COOKIE }
  });
  const meData = await meRes.json();
  
  if (!meRes.ok) {
    console.log('❌ Not logged in. Please login via browser first and copy session cookie.');
    return;
  }
  
  console.log(`   ✅ Logged in as: ${meData.user.name} (${meData.user.email})`);
  console.log(`   Trial: ${meData.user.isOnTrial ? 'Yes' : 'No'}`);
  
  // Test 2: Check subscription usage
  console.log('\n2️⃣  Checking subscription limits...');
  const usageRes = await fetch(`${BASE_URL}/api/subscription/usage`, {
    headers: { 'Cookie': SESSION_COOKIE }
  });
  const usage = await usageRes.json();
  
  if (usageRes.ok) {
    console.log(`   Plan: ${usage.plan}`);
    console.log(`   Products: ${usage.usage.products.current}/${usage.usage.products.limit} (${usage.usage.products.percentage}%)`);
    console.log(`   Vendors: ${usage.usage.vendors.current}/${usage.usage.vendors.limit}`);
    console.log(`   Resellers: ${usage.usage.resellers.current}/${usage.usage.resellers.limit}`);
    console.log(`   Stock Items: ${usage.usage.stockItems.current}/${usage.usage.stockItems.limit}`);
  }
  
  // Test 3: Check premium features
  console.log('\n3️⃣  Checking premium features access...');
  
  const features = [
    { name: 'Vendor Claims', endpoint: '/api/vendor-claims' },
    { name: 'Reseller Network', endpoint: '/api/resellers' },
    { name: 'Advanced Analytics', endpoint: '/api/analytics/product-performance' },
  ];
  
  for (const feature of features) {
    const res = await fetch(`${BASE_URL}${feature.endpoint}`, {
      headers: { 'Cookie': SESSION_COOKIE }
    });
    
    if (res.status === 403) {
      console.log(`   🚫 ${feature.name}: BLOCKED (upgrade required)`);
    } else if (res.ok) {
      console.log(`   ✅ ${feature.name}: GRANTED`);
    } else {
      console.log(`   ⚠️  ${feature.name}: ${res.status}`);
    }
  }
  
  console.log('\n' + '='.repeat(50) + '\n');
}

testCurrentUser().catch(console.error);
