import { validateInput, registerSchema, loginSchema } from '../../src/validation/schemas';
import { ValidationError } from '../../src/errors';

describe('Validation schemas', () => {
  it('validates register input', () => {
    const result = validateInput(registerSchema, {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      password: 'password123',
    });
    expect(result.email).toBe('john@example.com');
  });

  it('rejects invalid email', () => {
    expect(() =>
      validateInput(registerSchema, {
        firstName: 'John',
        lastName: 'Doe',
        email: 'not-an-email',
        password: 'password123',
      }),
    ).toThrow(ValidationError);
  });

  it('rejects short password', () => {
    expect(() =>
      validateInput(registerSchema, {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: 'short',
      }),
    ).toThrow(ValidationError);
  });

  it('validates login input', () => {
    const result = validateInput(loginSchema, {
      email: 'john@example.com',
      password: 'password123',
    });
    expect(result.email).toBe('john@example.com');
  });
});
