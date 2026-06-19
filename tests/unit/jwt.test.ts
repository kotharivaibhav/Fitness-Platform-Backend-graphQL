import {
  generateTokenPair,
  verifyAccessToken,
  verifyRefreshToken,
  extractBearerToken,
  UserRole,
} from '../../src/utils/jwt';

describe('JWT utilities', () => {
  const payload = {
    userId: '507f1f77bcf86cd799439011',
    email: 'test@example.com',
    role: UserRole.USER,
  };

  it('generates and verifies access token', () => {
    const { accessToken } = generateTokenPair(payload);
    const decoded = verifyAccessToken(accessToken);
    expect(decoded.userId).toBe(payload.userId);
    expect(decoded.email).toBe(payload.email);
  });

  it('generates and verifies refresh token', () => {
    const { refreshToken } = generateTokenPair(payload);
    const decoded = verifyRefreshToken(refreshToken);
    expect(decoded.userId).toBe(payload.userId);
  });

  it('extracts bearer token from header', () => {
    expect(extractBearerToken('Bearer abc123')).toBe('abc123');
    expect(extractBearerToken('Basic abc')).toBeNull();
    expect(extractBearerToken(undefined)).toBeNull();
  });

  it('throws on invalid access token', () => {
    expect(() => verifyAccessToken('invalid.token.here')).toThrow(
      'Invalid or expired access token',
    );
  });
});
