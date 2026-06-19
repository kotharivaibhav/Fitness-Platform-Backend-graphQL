import { cacheService } from '../../src/cache/cache.service';
import { userService } from '../../src/modules/users/user.service';
import { nutritionService } from '../../src/modules/nutrition/nutrition.service';
import { DateTimeScalar, JSONScalar } from '../../src/graphql/scalars';
import { setupTestDatabase, teardownTestDatabase, clearDatabase } from '../helpers/database';
import { createTestUser } from '../helpers/auth';
import { UserRole } from '../../src/utils/jwt';
import { aiService } from '../../src/modules/ai/ai.service';

describe('CacheService', () => {
  it('stores and retrieves cached values', async () => {
    await cacheService.set('test-key', { foo: 'bar' }, 60);
    const result = await cacheService.get<{ foo: string }>('test-key');
    expect(result?.foo).toBe('bar');
  });

  it('invalidates user cache keys', async () => {
    await cacheService.setUser('user-1', { id: 'user-1' });
    await cacheService.invalidateUser('user-1');
    const result = await cacheService.getUser('user-1');
    expect(result).toBeNull();
  });
});

describe('UserService', () => {
  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    await clearDatabase();
  });

  it('gets and updates user profile', async () => {
    const { user } = await createTestUser({ email: 'profile@test.com' });

    const fetched = await userService.getUser(user._id.toString());
    expect(fetched.email).toBe('profile@test.com');

    const updated = await userService.updateProfile(user._id.toString(), { firstName: 'Updated' });
    expect(updated.firstName).toBe('Updated');
  });
});

describe('NutritionService', () => {
  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    await clearDatabase();
  });

  it('returns latest nutrition plan for user', async () => {
    const { user } = await createTestUser();
    const userId = user._id.toString();
    const requester = { userId, email: user.email, role: UserRole.USER };

    await aiService.generateAndStoreNutritionPlan(userId, {});

    const plan = await nutritionService.getNutritionPlan(userId, requester);
    expect(plan.calories).toBeGreaterThan(0);
    expect(plan.meals.length).toBeGreaterThan(0);
  });
});

describe('GraphQL Scalars', () => {
  it('serializes DateTime scalar', () => {
    const date = new Date('2024-01-15T10:00:00.000Z');
    expect(DateTimeScalar.serialize(date)).toBe('2024-01-15T10:00:00.000Z');
  });

  it('serializes JSON scalar', () => {
    const data = { key: 'value', count: 42 };
    expect(JSONScalar.serialize(data)).toEqual(data);
  });
});
