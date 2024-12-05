// lib/redis.ts
import Redis from 'ioredis';

let redis: Redis | null = null;

// Only create Redis instance on the server side
if (typeof window === 'undefined') {
  redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
    lazyConnect: true,
    retryStrategy: (times) => Math.min(times * 50, 2000)
  });
}

export const cacheUtils = {
  async get(key: string) {
    if (!redis) return null;
    try {
      const data = await redis.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Redis get error:', error);
      return null;
    }
  },

  async set(key: string, data: any, expiryInSeconds = 3600) {
    if (!redis) return;
    try {
      await redis.setex(key, expiryInSeconds, JSON.stringify(data));
    } catch (error) {
      console.error('Redis set error:', error);
    }
  },

  async invalidate(pattern: string) {
    if (!redis) return;
    try {
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } catch (error) {
      console.error('Redis invalidate error:', error);
    }
  },

  async getAllData() {
    if (!redis) return null;
    try {
      const allData = await redis.get('all_tabs_data');
      return allData ? JSON.parse(allData) : null;
    } catch (error) {
      console.error('Redis getAllData error:', error);
      return null;
    }
  }
};