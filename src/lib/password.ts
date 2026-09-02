/**
 * Password hashing utilities using Web Crypto API (SHA-256 + salt).
 * Format: `salt:hash` — both hex-encoded.
 */

function toHex(buffer: ArrayBuffer | Uint8Array): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function generateSalt(length = 16): Uint8Array {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return array;
}

export async function hashPassword(password: string): Promise<string> {
  const salt = generateSalt();
  const saltHex = toHex(salt);
  const data = new TextEncoder().encode(saltHex + ':' + password);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return `${saltHex}:${toHex(hash)}`;
}

export async function verifyPassword(
  password: string,
  storedHash: string
): Promise<boolean> {
  const [saltHex, hashHex] = storedHash.split(':');
  if (!saltHex || !hashHex) return false;

  const data = new TextEncoder().encode(saltHex + ':' + password);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return toHex(hash) === hashHex;
}

export function generateOTP(): string {
  const digits = new Uint8Array(1);
  crypto.getRandomValues(digits);
  // Generate a 6-digit code
  return String(Math.floor(100000 + crypto.getRandomValues(new Uint32Array(1))[0] % 900000));
}
