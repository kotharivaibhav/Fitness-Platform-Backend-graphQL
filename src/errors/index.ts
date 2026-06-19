import { GraphQLFormattedError, GraphQLError } from 'graphql';

export enum ErrorCode {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  AUTH_ERROR = 'AUTH_ERROR',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  RATE_LIMIT = 'RATE_LIMIT',
}

export interface GraphQLErrorExtensions {
  code: ErrorCode;
  statusCode: number;
  details?: unknown;
}

export class BaseError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: number;
  public readonly details?: unknown;

  constructor(message: string, code: ErrorCode, statusCode: number, details?: unknown) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }

  toGraphQLError(): GraphQLError {
    return new GraphQLError(this.message, {
      extensions: {
        code: this.code,
        statusCode: this.statusCode,
        details: this.details,
      } satisfies GraphQLErrorExtensions,
    });
  }
}

export class ValidationError extends BaseError {
  constructor(message: string, details?: unknown) {
    super(message, ErrorCode.VALIDATION_ERROR, 400, details);
  }
}

export class AuthError extends BaseError {
  constructor(message = 'Authentication required') {
    super(message, ErrorCode.AUTH_ERROR, 401);
  }
}

export class ForbiddenError extends BaseError {
  constructor(message = 'Insufficient permissions') {
    super(message, ErrorCode.FORBIDDEN, 403);
  }
}

export class NotFoundError extends BaseError {
  constructor(resource: string) {
    super(`${resource} not found`, ErrorCode.NOT_FOUND, 404);
  }
}

export function formatGraphQLError(
  formattedError: GraphQLFormattedError,
  error: unknown,
): GraphQLFormattedError {
  const originalError = error instanceof GraphQLError ? error.originalError : error;

  if (originalError instanceof BaseError) {
    const gqlError = originalError.toGraphQLError();
    return {
      message: gqlError.message,
      locations: formattedError.locations,
      path: formattedError.path,
      extensions: gqlError.extensions as GraphQLFormattedError['extensions'],
    };
  }

  if (process.env.NODE_ENV === 'production' && !formattedError.extensions?.code) {
    return {
      message: 'Internal server error',
      extensions: {
        code: ErrorCode.INTERNAL_ERROR,
        statusCode: 500,
      },
    };
  }

  return formattedError;
}
