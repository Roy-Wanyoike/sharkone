import { describe, it, expect } from 'vitest';
import { hashPassword, verifyPassword, generateOTP } from './password';

describe('hashPassword & verifyPassword', () => {
  it('hashes a password and verifies it correctly', async () => {
    const hash = await hashPassword('mySecret123');
    expect(hash).toContain(':');
    expect(await verifyPassword('mySecret123', hash)).toBe(true);
  });

  it('rejects an incorrect password', async () => {
    const hash = await hashPassword('mySecret123');
    expect(await verifyPassword('wrongPassword', hash)).toBe(false);
  });

  it('produces different hashes for the same password (salt uniqueness)', async () => {
    const hash1 = await hashPassword('samePassword');
    const hash2 = await hashPassword('samePassword');
    expect(hash1).not.toBe(hash2);
    // But both should verify
    expect(await verifyPassword('samePassword', hash1)).toBe(true);
    expect(await verifyPassword('samePassword', hash2)).toBe(true);
  });

  it('handles empty string password', async () => {
    const hash = await hashPassword('');
    expect(hash).toContain(':');
    expect(await verifyPassword('', hash)).toBe(true);
    expect(await verifyPassword('nonempty', hash)).toBe(false);
  });

  it('rejects malformed stored hash (no colon)', async () => {
    expect(await verifyPassword('test', 'invalidhash')).toBe(false);
  });

  it('rejects empty stored hash', async () => {
    expect(await verifyPassword('test', '')).toBe(false);
  });

  it('hash format is hex:hex', async () => {
    const hash = await hashPassword('testpass');
    const [saltHex, hashHex] = hash.split(':');
    expect(saltHex).toMatch(/^[0-9a-f]+$/);
    expect(hashHex).toMatch(/^[0-9a-f]+$/);
    // Salt should be 16 bytes = 32 hex chars
    expect(saltHex).toHaveLength(32);
    // SHA-256 hash = 32 bytes = 64 hex chars
    expect(hashHex).toHaveLength(64);
  });
});

describe('generateOTP', () => {
  it('generates a 6-digit OTP', () => {
    const otp = generateOTP();
    expect(otp).toHaveLength(6);
    expect(otp).toMatch(/^\d{6}$/);
  });

  it('OTP is between 100000 and 999999', () => {
    for (let i = 0; i < 100; i++) {
      const otp = generateOTP();
      const num = parseInt(otp, 10);
      expect(num).toBeGreaterThanOrEqual(100000);
      expect(num).toBeLessThanOrEqual(999999);
    }
  });

  it('generates unique OTPs (high probability over 100 samples)', () => {
    const otps = new Set<string>();
    for (let i = 0; i < 100; i++) {
      otps.add(generateOTP());
    }
    // With 900,000 possible values, 100 samples should be nearly all unique
    // Allow some small tolerance but expect at least 95 unique
    expect(otps.size).toBeGreaterThanOrEqual(95);
  });
});
