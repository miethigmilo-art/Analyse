import Redis from 'ioredis';

let redis: Redis | null = null;

function getRedis(): Redis | null {
  if (!process.env.REDIS_URL) return null;
  if (!redis) {
    redis = new Redis(process.env.REDIS_URL, { lazyConnect: true, enableOfflineQueue: false });
    redis.on('error', () => { redis = null; });
  }
  return redis;
}

export async function cacheGet<T>(key: string): Promise<T | null> {
  try {
    const r = getRedis();
    if (!r) return null;
    const val = await r.get(key);
    return val ? JSON.parse(val) : null;
  } catch { return null; }
}

export async function cacheSet(key: string, value: unknown, ttlSeconds = 300): Promise<void> {
  try {
    const r = getRedis();
    if (!r) return;
    await r.setex(key, ttlSeconds, JSON.stringify(value));
  } catch { /* ignore */ }
}
