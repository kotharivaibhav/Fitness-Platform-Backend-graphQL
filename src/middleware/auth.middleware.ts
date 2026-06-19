import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, extractBearerToken } from '../utils/jwt';
import { AuthError } from '../errors';
import { logRequest } from '../logger';

export function authMiddleware(req: Request, _res: Response, next: NextFunction): void {
  const token = extractBearerToken(req.headers.authorization);
  if (!token) {
    req.user = null;
    return next();
  }

  try {
    req.user = verifyAccessToken(token);
  } catch {
    req.user = null;
  }
  next();
}

export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  if (!req.user) {
    next(new AuthError());
    return;
  }
  next();
}

export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();
  res.on('finish', () => {
    logRequest(req.method, req.path, res.statusCode, Date.now() - start);
  });
  next();
}
