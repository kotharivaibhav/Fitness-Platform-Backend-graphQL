import { authService } from '../../src/modules/auth/auth.service';
import { IUser } from '../../src/models/User';

export async function createTestUser(
  overrides: Partial<{
    firstName: string;
    lastName: string;
    email: string;
    password: string;
  }> = {},
): Promise<{ user: IUser; accessToken: string; refreshToken: string }> {
  const { user, tokens } = await authService.register({
    firstName: overrides.firstName ?? 'Test',
    lastName: overrides.lastName ?? 'User',
    email: overrides.email ?? `test-${Date.now()}@example.com`,
    password: overrides.password ?? 'password123',
    age: 28,
    gender: 'MALE',
    height: 175,
    weight: 75,
    goal: 'MUSCLE_GAIN',
    activityLevel: 'MODERATE',
  });

  return { user, accessToken: tokens.accessToken, refreshToken: tokens.refreshToken };
}
