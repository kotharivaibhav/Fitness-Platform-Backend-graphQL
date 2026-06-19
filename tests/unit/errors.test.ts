import {
  ValidationError,
  AuthError,
  ForbiddenError,
  NotFoundError,
  ErrorCode,
  formatGraphQLError,
} from '../../src/errors';
import { GraphQLError } from 'graphql';

describe('Error classes', () => {
  it('ValidationError has correct code and status', () => {
    const error = new ValidationError('Invalid input', { field: 'email' });
    expect(error.code).toBe(ErrorCode.VALIDATION_ERROR);
    expect(error.statusCode).toBe(400);
    expect(error.details).toEqual({ field: 'email' });
  });

  it('AuthError defaults message', () => {
    const error = new AuthError();
    expect(error.message).toBe('Authentication required');
    expect(error.statusCode).toBe(401);
  });

  it('ForbiddenError has 403 status', () => {
    const error = new ForbiddenError();
    expect(error.statusCode).toBe(403);
  });

  it('NotFoundError formats resource name', () => {
    const error = new NotFoundError('Workout');
    expect(error.message).toBe('Workout not found');
    expect(error.statusCode).toBe(404);
  });

  it('BaseError converts to GraphQLError', () => {
    const error = new ValidationError('Bad request');
    const gqlError = error.toGraphQLError();
    expect(gqlError.message).toBe('Bad request');
    expect(gqlError.extensions?.code).toBe(ErrorCode.VALIDATION_ERROR);
  });

  it('formatGraphQLError passes through BaseError', () => {
    const baseError = new AuthError('Token expired');
    const gqlError = new GraphQLError('Token expired', { originalError: baseError });
    const formatted = formatGraphQLError(
      { message: gqlError.message, extensions: gqlError.extensions },
      gqlError,
    );
    expect(formatted.extensions?.code).toBe(ErrorCode.AUTH_ERROR);
  });
});
