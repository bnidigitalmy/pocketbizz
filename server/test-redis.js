#!/usr/bin/env node
/**
 * Redis Connection Test Script
 * 
 * Tests Redis connectivity and basic operations
 * Run with: node server/test-redis.js
 */

import { redis } from './redis';

async function testRedis() {
  console.log('🔴 Testing Redis Connection...\n');

  try {
    // Test 1: Ping
    console.log('Test 1: Ping Redis server');
    const pingResult = await redis.ping();
    console.log(`✅ PING response: ${pingResult}\n`);

    // Test 2: Set a value
    console.log('Test 2: Set test value');
    await redis.set('pocketbizz:test:key', 'Hello Redis!', {
      EX: 60, // Expire in 60 seconds
    });
    console.log('✅ Set value successfully\n');

    // Test 3: Get the value
    console.log('Test 3: Get test value');
    const value = await redis.get('pocketbizz:test:key');
    console.log(`✅ Retrieved value: ${value}\n`);

    // Test 4: Check TTL
    console.log('Test 4: Check TTL');
    const ttl = await redis.ttl('pocketbizz:test:key');
    console.log(`✅ TTL: ${ttl} seconds\n`);

    // Test 5: Delete the test key
    console.log('Test 5: Clean up test key');
    await redis.del('pocketbizz:test:key');
    console.log('✅ Test key deleted\n');

    // Test 6: Count existing keys
    console.log('Test 6: Count PocketBizz keys');
    const keys = await redis.keys('pocketbizz:*');
    console.log(`✅ Found ${keys.length} existing keys\n`);

    if (keys.length > 0) {
      console.log('Existing keys:');
      keys.slice(0, 5).forEach(key => console.log(`  - ${key}`));
      if (keys.length > 5) {
        console.log(`  ... and ${keys.length - 5} more`);
      }
    }

    console.log('\n🎉 All Redis tests passed!\n');
    console.log('Redis is ready for:');
    console.log('  ✅ Session storage');
    console.log('  ✅ Rate limiting');
    console.log('  ✅ Caching (future)\n');

  } catch (error) {
    console.error('\n❌ Redis test failed:', error);
    console.error('\nTroubleshooting:');
    console.error('  1. Check if Redis is running: redis-cli ping');
    console.error('  2. Verify REDIS_URL in .env file');
    console.error('  3. For local dev: brew services start redis (macOS)');
    console.error('  4. For Docker: docker run -d -p 6379:6379 redis:7-alpine\n');
    process.exit(1);
  } finally {
    // Close Redis connection
    await redis.quit();
    console.log('Connection closed. Test complete.');
    process.exit(0);
  }
}

// Run tests
testRedis();
