import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { config } from '../config';
import { AuthError } from '../errors';

export enum UserRole {
  USER = 'USER',
  TRAINER = 'TRAINER',
  ADMIN = 'ADMIN',
}

export interface JwtPayload {
  userId: string;
  email: string;
  role: UserRole;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export function generateAccessToken(payload: JwtPayload): string {
  return jwt.sign(payload, config.JWT_ACCESS_SECRET, {
    expiresIn: config.JWT_ACCESS_EXPIRES_IN,
  } as jwt.SignOptions);
}

export function generateRefreshToken(payload: JwtPayload): string {
  return jwt.sign({ ...payload, jti: crypto.randomUUID() }, config.JWT_REFRESH_SECRET, {
    expiresIn: config.JWT_REFRESH_EXPIRES_IN,
  } as jwt.SignOptions);
}

export function generateTokenPair(payload: JwtPayload): TokenPair {
  return {
    accessToken: generateAccessToken(payload),
    refreshToken: generateRefreshToken(payload),
  };
}

export function verifyAccessToken(token: string): JwtPayload {
  try {
    return jwt.verify(token, config.JWT_ACCESS_SECRET) as JwtPayload;
  } catch {
    throw new AuthError('Invalid or expired access token');
  }
}

export function verifyRefreshToken(token: string): JwtPayload {
  try {
    return jwt.verify(token, config.JWT_REFRESH_SECRET) as JwtPayload;
  } catch {
    throw new AuthError('Invalid or expired refresh token');
  }
}

export function extractBearerToken(authHeader?: string): string | null {
  if (!authHeader?.startsWith('Bearer ')) return null;
  return authHeader.slice(7);
}
