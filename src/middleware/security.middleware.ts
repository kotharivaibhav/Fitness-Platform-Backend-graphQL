import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import { config } from '../config';
import { BaseError, ErrorCode } from '../errors';
import { logger } from '../logger';

export const apiRateLimiter = rateLimit({
  windowMs: config.RATE_LIMIT_WINDOW_MS,
  max: config.RATE_LIMIT_MAX_REQUESTS,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    res.status(429).json({
      errors: [
        {
          message: 'Too many requests, please try again later',
          extensions: { code: ErrorCode.RATE_LIMIT, statusCode: 429 },
        },
      ],
    });
  },
});

export function csrfProtection(req: Request, res: Response, next: NextFunction): void {
  if (req.method === 'GET' || req.method === 'OPTIONS' || req.method === 'HEAD') {
    return next();
  }

  const csrfToken = req.headers['x-csrf-token'] as string | undefined;
  const csrfCookie = req.headers['x-csrf-cookie'] as string | undefined;

  if (process.env.NODE_ENV === 'test') {
    return next();
  }

  if (!csrfToken || !csrfCookie || csrfToken !== csrfCookie) {
    res.status(403).json({
      errors: [
        {
          message: 'CSRF token validation failed',
          extensions: { code: ErrorCode.FORBIDDEN, statusCode: 403 },
        },
      ],
    });
    return;
  }
  next();
}

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof BaseError) {
    logger.warn('Application error', { code: err.code, message: err.message });
    res.status(err.statusCode).json({
      errors: [
        { message: err.message, extensions: { code: err.code, statusCode: err.statusCode } },
      ],
    });
    return;
  }

  logger.error('Unhandled error', { error: err.message, stack: err.stack });
  res.status(500).json({
    errors: [
      {
        message: 'Internal server error',
        extensions: { code: ErrorCode.INTERNAL_ERROR, statusCode: 500 },
      },
    ],
  });
}
