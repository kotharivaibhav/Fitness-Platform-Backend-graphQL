import Redis from 'ioredis';
import { config } from './index';
import { logger } from '../logger';

let redisClient: Redis | null = null;
let redisSubscriber: Redis | null = null;
let redisPublisher: Redis | null = null;

export function getRedisClient(): Redis {
  if (!redisClient) {
    redisClient = new Redis({
      host: config.REDIS_HOST,
      port: config.REDIS_PORT,
      password: config.REDIS_PASSWORD || undefined,
      db: config.REDIS_DB,
      maxRetriesPerRequest: 3,
      lazyConnect: true,
    });

    redisClient.on('error', (err) => {
      logger.error('Redis client error', { error: err.message });
    });

    redisClient.on('connect', () => {
      logger.info('Redis client connected');
    });
  }
  return redisClient;
}

export function getRedisSubscriber(): Redis {
  if (!redisSubscriber) {
    redisSubscriber = getRedisClient().duplicate();
  }
  return redisSubscriber;
}

export function getRedisPublisher(): Redis {
  if (!redisPublisher) {
    redisPublisher = getRedisClient().duplicate();
  }
  return redisPublisher;
}

export async function connectRedis(): Promise<void> {
  const client = getRedisClient();
  if (client.status !== 'ready') {
    await client.connect();
  }
}

export async function disconnectRedis(): Promise<void> {
  const clients = [redisClient, redisSubscriber, redisPublisher].filter(Boolean) as Redis[];
  await Promise.all(clients.map((c) => c.quit()));
  redisClient = null;
  redisSubscriber = null;
  redisPublisher = null;
  logger.info('Redis disconnected');
}

export const CACHE_KEYS = {
  user: (id: string) => `user:${id}`,
  userWorkouts: (userId: string) => `user:${userId}:workouts`,
  workout: (id: string) => `workout:${id}`,
  analytics: (userId: string, period: string) => `analytics:${userId}:${period}`,
  refreshToken: (token: string) => `refresh:${token}`,
  persistedQuery: (hash: string) => `pq:${hash}`,
} as const;
