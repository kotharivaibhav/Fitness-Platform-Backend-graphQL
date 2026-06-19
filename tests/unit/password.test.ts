import { hashPassword, comparePassword } from '../../src/utils/password';

describe('Password utilities', () => {
  it('hashes and compares passwords correctly', async () => {
    const password = 'securePassword123';
    const hash = await hashPassword(password);
    expect(hash).not.toBe(password);
    expect(await comparePassword(password, hash)).toBe(true);
    expect(await comparePassword('wrong', hash)).toBe(false);
  });
});
