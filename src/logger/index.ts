import winston from 'winston';
import { config } from '../config';

const { combine, timestamp, printf, colorize, errors } = winston.format;

const logFormat = printf(({ level, message, timestamp: ts, ...meta }) => {
  const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
  return `${ts} [${level}]: ${message}${metaStr}`;
});

export const logger = winston.createLogger({
  level: config.LOG_LEVEL,
  format: combine(errors({ stack: true }), timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), logFormat),
  defaultMeta: { service: 'fitness-platform' },
  transports: [
    new winston.transports.Console({
      format: combine(colorize(), logFormat),
    }),
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
});

export function logGraphQLQuery(
  operationName: string | undefined,
  query: string,
  variables?: Record<string, unknown>,
): void {
  logger.info('GraphQL Query', {
    operationName,
    query: query.substring(0, 500),
    variables,
  });
}

export function logAuthEvent(
  event: string,
  userId?: string,
  metadata?: Record<string, unknown>,
): void {
  logger.info(`Auth: ${event}`, { userId, ...metadata });
}

export function logRequest(
  method: string,
  path: string,
  statusCode: number,
  durationMs: number,
): void {
  logger.info('HTTP Request', { method, path, statusCode, durationMs });
}
