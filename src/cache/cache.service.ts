import { getRedisClient, CACHE_KEYS } from '../config/redis';
import { config } from '../config';
import { logger } from '../logger';

export class CacheService {
  private redis = getRedisClient();

  async get<T>(key: string): Promise<T | null> {
    try {
      const data = await this.redis.get(key);
      return data ? (JSON.parse(data) as T) : null;
    } catch (error) {
      logger.warn('Cache get failed', { key, error });
      return null;
    }
  }

  async set(key: string, value: unknown, ttlSeconds?: number): Promise<void> {
    try {
      const serialized = JSON.stringify(value);
      if (ttlSeconds) {
        await this.redis.setex(key, ttlSeconds, serialized);
      } else {
        await this.redis.set(key, serialized);
      }
    } catch (error) {
      logger.warn('Cache set failed', { key, error });
    }
  }

  async del(...keys: string[]): Promise<void> {
    try {
      if (keys.length > 0) await this.redis.del(...keys);
    } catch (error) {
      logger.warn('Cache del failed', { keys, error });
    }
  }

  async invalidateUser(userId: string): Promise<void> {
    await this.del(
      CACHE_KEYS.user(userId),
      CACHE_KEYS.userWorkouts(userId),
      CACHE_KEYS.analytics(userId, 'weekly'),
      CACHE_KEYS.analytics(userId, 'monthly'),
    );
  }

  async invalidateWorkout(workoutId: string, userId?: string): Promise<void> {
    const keys = [CACHE_KEYS.workout(workoutId)];
    if (userId) keys.push(CACHE_KEYS.userWorkouts(userId));
    await this.del(...keys);
  }

  // User cache
  async getUser<T>(userId: string): Promise<T | null> {
    return this.get<T>(CACHE_KEYS.user(userId));
  }

  async setUser(userId: string, user: unknown): Promise<void> {
    await this.set(CACHE_KEYS.user(userId), user, config.CACHE_USER_TTL);
  }

  // Workout cache
  async getWorkout<T>(workoutId: string): Promise<T | null> {
    return this.get<T>(CACHE_KEYS.workout(workoutId));
  }

  async setWorkout(workoutId: string, workout: unknown): Promise<void> {
    await this.set(CACHE_KEYS.workout(workoutId), workout, config.CACHE_WORKOUT_TTL);
  }

  // Analytics cache
  async getAnalytics<T>(userId: string, period: string): Promise<T | null> {
    return this.get<T>(CACHE_KEYS.analytics(userId, period));
  }

  async setAnalytics(userId: string, period: string, data: unknown): Promise<void> {
    await this.set(CACHE_KEYS.analytics(userId, period), data, config.CACHE_ANALYTICS_TTL);
  }

  // Refresh token storage
  async storeRefreshToken(token: string, userId: string, ttlSeconds: number): Promise<void> {
    await this.set(CACHE_KEYS.refreshToken(token), { userId }, ttlSeconds);
  }

  async getRefreshTokenUserId(token: string): Promise<string | null> {
    const data = await this.get<{ userId: string }>(CACHE_KEYS.refreshToken(token));
    return data?.userId ?? null;
  }

  async revokeRefreshToken(token: string): Promise<void> {
    await this.del(CACHE_KEYS.refreshToken(token));
  }

  // Persisted queries
  async getPersistedQuery(hash: string): Promise<string | null> {
    return this.get<string>(CACHE_KEYS.persistedQuery(hash));
  }

  async setPersistedQuery(hash: string, query: string): Promise<void> {
    await this.set(CACHE_KEYS.persistedQuery(hash), query);
  }
}

export const cacheService = new CacheService();
