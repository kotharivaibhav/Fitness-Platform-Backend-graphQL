process.env.NODE_ENV = 'test';
process.env.MONGODB_URI = process.env.MONGODB_URI ?? 'mongodb://127.0.0.1:27017/fitness_test';
process.env.JWT_ACCESS_SECRET =
  process.env.JWT_ACCESS_SECRET ?? 'test-access-secret-key-minimum-32-chars';
process.env.JWT_REFRESH_SECRET =
  process.env.JWT_REFRESH_SECRET ?? 'test-refresh-secret-key-minimum-32-chars';
process.env.CSRF_SECRET = process.env.CSRF_SECRET ?? 'test-csrf-secret-key-min';
process.env.REDIS_HOST = process.env.REDIS_HOST ?? 'localhost';
process.env.REDIS_PORT = process.env.REDIS_PORT ?? '6379';
process.env.LOG_LEVEL = 'error';

jest.mock('../src/config/redis', () => {
  const store = new Map<string, string>();
  const mockRedis = {
    status: 'ready',
    connect: jest.fn().mockResolvedValue(undefined),
    get: jest.fn((key: string) => Promise.resolve(store.get(key) ?? null)),
    set: jest.fn((key: string, value: string) => {
      store.set(key, value);
      return Promise.resolve('OK');
    }),
    setex: jest.fn((key: string, _ttl: number, value: string) => {
      store.set(key, value);
      return Promise.resolve('OK');
    }),
    del: jest.fn((...keys: string[]) => {
      keys.forEach((k) => store.delete(k));
      return Promise.resolve(keys.length);
    }),
    publish: jest.fn().mockResolvedValue(1),
    subscribe: jest.fn().mockResolvedValue(undefined),
    unsubscribe: jest.fn().mockResolvedValue(undefined),
    on: jest.fn(),
    quit: jest.fn().mockResolvedValue('OK'),
    duplicate: jest.fn(function (this: unknown) {
      return this;
    }),
  };

  return {
    getRedisClient: () => mockRedis,
    getRedisSubscriber: () => mockRedis,
    getRedisPublisher: () => mockRedis,
    connectRedis: jest.fn().mockResolvedValue(undefined),
    disconnectRedis: jest.fn().mockResolvedValue(undefined),
    CACHE_KEYS: {
      user: (id: string) => `user:${id}`,
      userWorkouts: (userId: string) => `user:${userId}:workouts`,
      workout: (id: string) => `workout:${id}`,
      analytics: (userId: string, period: string) => `analytics:${userId}:${period}`,
      refreshToken: (token: string) => `refresh:${token}`,
      persistedQuery: (hash: string) => `pq:${hash}`,
    },
  };
});

jest.mock('../src/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
  logGraphQLQuery: jest.fn(),
  logAuthEvent: jest.fn(),
  logRequest: jest.fn(),
}));
