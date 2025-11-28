import { createClient } from 'redis';

// Check if Redis URL is configured
const REDIS_URL = process.env.REDIS_URL;

if (!REDIS_URL) {
  console.warn('⚠️  REDIS_URL not configured - Redis features disabled');
  console.warn('   Sessions will use PostgreSQL (slower but functional)');
  console.warn('   Add Redis database in Railway to enable Redis features');
}

// Create Redis client with error handling and reconnection logic
export const redis = REDIS_URL ? createClient({
  url: REDIS_URL,
  socket: {
    connectTimeout: 5000, // 5 second connection timeout
    reconnectStrategy: (retries) => {
      // Retry connection with exponential backoff
      if (retries > 5) {
        console.error('Redis: Max reconnection attempts reached');
        return false; // Stop reconnecting
      }
      const delay = Math.min(retries * 100, 2000);
      console.log(`Redis: Reconnecting in ${delay}ms (attempt ${retries})`);
      return delay;
    },
  },
}) : null;

// Only setup event handlers if Redis is configured
if (redis) {
  // Handle Redis connection events
  redis.on('error', (err) => {
    console.error('Redis Client Error:', err);
  });

  redis.on('connect', () => {
    console.log('✓ Redis connected successfully');
  });

  redis.on('reconnecting', () => {
    console.log('Redis: Reconnecting...');
  });

  redis.on('ready', () => {
    console.log('✓ Redis client ready');
  });

  // Connect to Redis on module load (non-blocking)
  (async () => {
    try {
      await redis.connect();
    } catch (error) {
      console.error('Failed to connect to Redis:', error);
      console.error('Application will continue without Redis (using PostgreSQL for sessions)');
    }
  })().catch(() => {
    // Silently catch to prevent unhandled rejection
    // App will work without Redis using PostgreSQL sessions
  });

  // Graceful shutdown
  process.on('SIGINT', async () => {
    try {
      await redis.quit();
    } catch (err) {
      // Ignore quit errors
    }
    process.exit(0);
  });
}

export default redis;
