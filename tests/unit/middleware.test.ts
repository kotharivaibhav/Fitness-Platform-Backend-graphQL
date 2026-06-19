import {
  generateCsrfToken,
  hashQuery,
  hashPersistedQuery,
  getWeekStart,
  getMonthStart,
  toObjectIdString,
} from '../../src/utils/helpers';
import { pubSubService, SUBSCRIPTION_CHANNELS } from '../../src/cache/pubsub.service';
import { authMiddleware, requireAuth } from '../../src/middleware/auth.middleware';
import {
  createComplexityPlugin,
  createLoggingPlugin,
  resolvePersistedQuery,
} from '../../src/middleware/graphql.security';
import { generateTokenPair, UserRole } from '../../src/utils/jwt';

describe('Helper utilities', () => {
  it('generates CSRF token', () => {
    const token = generateCsrfToken();
    expect(token).toHaveLength(64);
  });

  it('hashes queries consistently', () => {
    const hash1 = hashQuery('query { me { id } }');
    const hash2 = hashQuery('query { me { id } }');
    expect(hash1).toBe(hash2);
    expect(hash1).not.toBe(hashQuery('different'));
  });

  it('creates persisted query hash', () => {
    expect(hashPersistedQuery('query')).toBeTruthy();
  });

  it('computes week and month start dates', () => {
    const weekStart = getWeekStart(new Date('2024-06-18'));
    expect(weekStart.getDay()).toBe(1);

    const monthStart = getMonthStart(new Date('2024-06-18'));
    expect(monthStart.getDate()).toBe(1);
  });

  it('converts object ids to strings', () => {
    expect(toObjectIdString('abc')).toBe('abc');
    expect(toObjectIdString({ toString: () => 'obj-id' })).toBe('obj-id');
  });
});

describe('PubSubService', () => {
  it('publishes messages to Redis channel', async () => {
    await expect(
      pubSubService.publish(SUBSCRIPTION_CHANNELS.PROGRESS_UPDATED, { userId: '1' }),
    ).resolves.not.toThrow();
  });
});

describe('Auth middleware', () => {
  it('sets user from valid bearer token', () => {
    const { accessToken } = generateTokenPair({
      userId: '507f1f77bcf86cd799439011',
      email: 'test@example.com',
      role: UserRole.USER,
    });

    const req = { headers: { authorization: `Bearer ${accessToken}` } } as never;
    const next = jest.fn();

    authMiddleware(req, {} as never, next);
    expect((req as Express.Request).user?.email).toBe('test@example.com');
    expect(next).toHaveBeenCalled();
  });

  it('requireAuth rejects unauthenticated requests', () => {
    const req = { user: null } as never;
    const next = jest.fn();
    requireAuth(req, {} as never, next);
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
  });
});

describe('GraphQL security plugins', () => {
  it('creates complexity and logging plugins', () => {
    expect(createComplexityPlugin()).toBeDefined();
    expect(createLoggingPlugin()).toBeDefined();
  });

  it('resolves persisted queries from cache', async () => {
    const query = 'query { me { id } }';
    const hash = hashPersistedQuery(query);
    const resolved = await resolvePersistedQuery(hash, query);
    expect(resolved).toBe(query);
  });
});
