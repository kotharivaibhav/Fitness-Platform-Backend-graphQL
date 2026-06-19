import { z } from 'zod';
import { userRepository } from '../../repositories/user.repository';
import { cacheService } from '../../cache/cache.service';
import { hashPassword, comparePassword } from '../../utils/password';
import { generateTokenPair, verifyRefreshToken, JwtPayload, UserRole } from '../../utils/jwt';
import { AuthError, ValidationError, NotFoundError } from '../../errors';
import { logAuthEvent } from '../../logger';
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  validateInput,
} from '../../validation/schemas';
import { IUser } from '../../models/User';

const REFRESH_TOKEN_TTL = 7 * 24 * 60 * 60; // 7 days in seconds

export class AuthService {
  async register(
    input: unknown,
  ): Promise<{ user: IUser; tokens: ReturnType<typeof generateTokenPair> }> {
    const data = validateInput(registerSchema, input);

    const existing = await userRepository.findByEmail(data.email);
    if (existing) {
      throw new ValidationError('Email already registered');
    }

    const hashedPassword = await hashPassword(data.password);
    const user = await userRepository.create({
      ...data,
      password: hashedPassword,
      role: UserRole.USER,
    });

    const payload: JwtPayload = {
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    };

    const tokens = generateTokenPair(payload);
    await cacheService.storeRefreshToken(
      tokens.refreshToken,
      user._id.toString(),
      REFRESH_TOKEN_TTL,
    );
    await cacheService.setUser(user._id.toString(), this.sanitizeUser(user));

    logAuthEvent('register', user._id.toString(), { email: user.email });
    return { user, tokens };
  }

  async login(
    input: unknown,
  ): Promise<{ user: IUser; tokens: ReturnType<typeof generateTokenPair> }> {
    const data = validateInput(loginSchema, input);

    const user = await userRepository.findByEmail(data.email, true);
    if (!user) {
      throw new AuthError('Invalid email or password');
    }

    const isValid = await comparePassword(data.password, user.password);
    if (!isValid) {
      throw new AuthError('Invalid email or password');
    }

    const payload: JwtPayload = {
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    };

    const tokens = generateTokenPair(payload);
    await cacheService.storeRefreshToken(
      tokens.refreshToken,
      user._id.toString(),
      REFRESH_TOKEN_TTL,
    );
    await cacheService.setUser(user._id.toString(), this.sanitizeUser(user));

    logAuthEvent('login', user._id.toString());
    return { user, tokens };
  }

  async refreshToken(input: unknown): Promise<{ accessToken: string; refreshToken: string }> {
    const { refreshToken } = validateInput(refreshTokenSchema, input);

    const storedUserId = await cacheService.getRefreshTokenUserId(refreshToken);
    if (!storedUserId) {
      throw new AuthError('Refresh token revoked or expired');
    }

    const payload = verifyRefreshToken(refreshToken);
    if (payload.userId !== storedUserId) {
      throw new AuthError('Invalid refresh token');
    }

    const user = await userRepository.findById(payload.userId);
    if (!user) {
      throw new NotFoundError('User');
    }

    await cacheService.revokeRefreshToken(refreshToken);

    const newPayload: JwtPayload = {
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    };

    const tokens = generateTokenPair(newPayload);
    await cacheService.storeRefreshToken(
      tokens.refreshToken,
      user._id.toString(),
      REFRESH_TOKEN_TTL,
    );

    logAuthEvent('token_refresh', user._id.toString());
    return tokens;
  }

  async logout(refreshToken: string): Promise<boolean> {
    await cacheService.revokeRefreshToken(refreshToken);
    logAuthEvent('logout');
    return true;
  }

  sanitizeUser(user: IUser): Record<string, unknown> {
    const obj = user.toObject();
    delete (obj as Record<string, unknown>).password;
    return obj;
  }
}

export const authService = new AuthService();

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
