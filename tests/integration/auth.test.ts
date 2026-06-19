import { setupTestDatabase, teardownTestDatabase, clearDatabase } from '../helpers/database';
import { authService } from '../../src/modules/auth/auth.service';
import { ValidationError, AuthError } from '../../src/errors';

describe('AuthService', () => {
  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    await clearDatabase();
  });

  it('registers a new user with tokens', async () => {
    const result = await authService.register({
      firstName: 'Jane',
      lastName: 'Doe',
      email: 'jane@example.com',
      password: 'password123',
    });

    expect(result.user.email).toBe('jane@example.com');
    expect(result.tokens.accessToken).toBeDefined();
    expect(result.tokens.refreshToken).toBeDefined();
  });

  it('rejects duplicate email registration', async () => {
    await authService.register({
      firstName: 'Jane',
      lastName: 'Doe',
      email: 'jane@example.com',
      password: 'password123',
    });

    await expect(
      authService.register({
        firstName: 'John',
        lastName: 'Doe',
        email: 'jane@example.com',
        password: 'password456',
      }),
    ).rejects.toThrow(ValidationError);
  });

  it('logs in with valid credentials', async () => {
    await authService.register({
      firstName: 'Jane',
      lastName: 'Doe',
      email: 'jane@example.com',
      password: 'password123',
    });

    const result = await authService.login({
      email: 'jane@example.com',
      password: 'password123',
    });

    expect(result.user.email).toBe('jane@example.com');
    expect(result.tokens.accessToken).toBeDefined();
  });

  it('rejects invalid login credentials', async () => {
    await expect(
      authService.login({ email: 'none@example.com', password: 'wrong' }),
    ).rejects.toThrow(AuthError);
  });

  it('refreshes tokens and rotates refresh token', async () => {
    const { tokens } = await authService.register({
      firstName: 'Jane',
      lastName: 'Doe',
      email: 'jane@example.com',
      password: 'password123',
    });

    const newTokens = await authService.refreshToken({ refreshToken: tokens.refreshToken });
    expect(newTokens.accessToken).toBeDefined();
    expect(newTokens.refreshToken).not.toBe(tokens.refreshToken);
  });

  it('logs out and revokes refresh token', async () => {
    const { tokens } = await authService.register({
      firstName: 'Jane',
      lastName: 'Doe',
      email: 'jane@example.com',
      password: 'password123',
    });

    await authService.logout(tokens.refreshToken);

    await expect(authService.refreshToken({ refreshToken: tokens.refreshToken })).rejects.toThrow(
      AuthError,
    );
  });
});
