import { createClient } from 'redis';

// Create Redis client with error handling and reconnection logic
export const redis = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
  socket: {
    reconnectStrategy: (retries) => {
      // Retry connection with exponential backoff
      if (retries > 10) {
        console.error('Redis: Max reconnection attempts reached');
        return new Error('Redis reconnection failed');
      }
      const delay = Math.min(retries * 100, 3000);
      console.log(`Redis: Reconnecting in ${delay}ms (attempt ${retries})`);
      return delay;
    },
  },
});

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

// Connect to Redis on module load
(async () => {
  try {
    await redis.connect();
  } catch (error) {
    console.error('Failed to connect to Redis:', error);
    // Don't crash the app if Redis is not available in development
    if (process.env.NODE_ENV === 'production') {
      throw error;
    }
  }
})();

// Graceful shutdown
process.on('SIGINT', async () => {
  await redis.quit();
  process.exit(0);
});

export default redis;
