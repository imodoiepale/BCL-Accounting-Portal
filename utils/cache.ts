// @ts-nocheck
import redis from '@/lib/redis';

const CACHE_TTL = 3600; // 1 hour in seconds

export const cacheUtils = {
  async get(key: string) {
    const data = await redis.get(key);
    return data ? JSON.parse(data) : null;
  },

  async set(key: string, data: any) {
    await redis.setex(key, CACHE_TTL, JSON.stringify(data));
  },

  async invalidate(pattern: string) {
    const keys = await redis.keys(pattern);
    if (keys.length) {
      await redis.del(keys);
    }
  }
};