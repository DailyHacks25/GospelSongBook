/**
 * Password hashing with Node's built-in scrypt (no native dependencies).
 *
 * Format: scrypt$<N>$<r>$<p>$<salt-hex>$<hash-hex>
 * - Per-user random salt (16 bytes)
 * - Key length 64 bytes
 * - Verification is constant-time (timingSafeEqual)
 */

import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

const KEY_LENGTH = 64;
const SALT_BYTES = 16;

interface ScryptParams {
  N: number;
  r: number;
  p: number;
}

const DEFAULT_PARAMS: ScryptParams = { N: 16384, r: 8, p: 1 };

export function hashPassword(password: string, params: ScryptParams = DEFAULT_PARAMS): string {
  if (typeof password !== "string" || password.length === 0) {
    throw new Error("Password must be a non-empty string.");
  }
  const salt = randomBytes(SALT_BYTES).toString("hex");
  const hash = scryptSync(password, salt, KEY_LENGTH, {
    N: params.N,
    r: params.r,
    p: params.p,
  }).toString("hex");
  return `scrypt$${params.N}$${params.r}$${params.p}$${salt}$${hash}`;
}

/**
 * Verify a password against a stored hash. Returns false for any malformed
 * stored value (never throws on bad data).
 */
export function verifyPassword(password: string, stored: string | null | undefined): boolean {
  if (typeof password !== "string" || password.length === 0) return false;
  if (typeof stored !== "string") return false;

  const parts = stored.split("$");
  if (parts.length !== 6 || parts[0] !== "scrypt") return false;

  const N = Number(parts[1]);
  const r = Number(parts[2]);
  const p = Number(parts[3]);
  const salt = parts[4];
  const expectedHex = parts[5];
  if (!Number.isInteger(N) || !Number.isInteger(r) || !Number.isInteger(p)) return false;
  if (N <= 0 || r <= 0 || p <= 0 || N > 1 << 20) return false;
  if (!/^[0-9a-f]+$/i.test(salt) || !/^[0-9a-f]+$/i.test(expectedHex)) return false;

  let expected: Buffer;
  try {
    expected = Buffer.from(expectedHex, "hex");
  } catch {
    return false;
  }
  if (expected.length !== KEY_LENGTH) return false;

  let actual: Buffer;
  try {
    actual = scryptSync(password, salt, KEY_LENGTH, { N, r, p });
  } catch {
    return false;
  }
  return timingSafeEqual(actual, expected);
}

/**
 * A hash of a throw-away string, used to equalize response time when the
 * account does not exist (mitigates user enumeration by timing).
 */
export const DUMMY_PASSWORD_HASH: string = hashPassword(randomBytes(24).toString("hex"));
