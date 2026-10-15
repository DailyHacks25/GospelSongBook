/**
 * In-memory login rate limiter (per email address).
 *
 * Policy: at most MAX_FAILURES failed sign-ins per email within the
 * observation window; afterwards the key is locked for LOCKOUT_MS.
 * Deliberately in-memory: it is per-process, best-effort brute-force
 * protection — the real gate is a strong password + hashed storage.
 */

const MAX_FAILURES = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const LOCKOUT_MS = 15 * 60 * 1000;

interface AttemptState {
  failures: number;
  firstFailureAt: number;
  lockedUntil: number;
}

const attempts = new Map<string, AttemptState>();

function nowDefault(): number {
  return Date.now();
}

export interface RateLimitOptions {
  maxFailures?: number;
  windowMs?: number;
  lockoutMs?: number;
  now?: () => number;
}

export function normalizeLoginKey(email: string): string {
  return email.trim().toLowerCase();
}

export function isLoginAllowed(email: string, options: RateLimitOptions = {}): boolean {
  const now = (options.now ?? nowDefault)();
  const state = attempts.get(normalizeLoginKey(email));
  if (!state) return true;
  if (state.lockedUntil > now) return false;
  const windowMs = options.windowMs ?? WINDOW_MS;
  if (now - state.firstFailureAt > windowMs) {
    attempts.delete(normalizeLoginKey(email));
    return true;
  }
  return state.failures < (options.maxFailures ?? MAX_FAILURES);
}

export function recordLoginFailure(email: string, options: RateLimitOptions = {}): void {
  const now = (options.now ?? nowDefault)();
  const key = normalizeLoginKey(email);
  const windowMs = options.windowMs ?? WINDOW_MS;
  const maxFailures = options.maxFailures ?? MAX_FAILURES;
  const lockoutMs = options.lockoutMs ?? LOCKOUT_MS;

  const state = attempts.get(key);
  if (!state || now - state.firstFailureAt > windowMs) {
    attempts.set(key, { failures: 1, firstFailureAt: now, lockedUntil: 0 });
    return;
  }
  state.failures += 1;
  if (state.failures >= maxFailures) {
    state.lockedUntil = now + lockoutMs;
  }
}

export function resetLoginFailures(email: string): void {
  attempts.delete(normalizeLoginKey(email));
}

/** Test helper: clear all state. */
export function clearLoginAttempts(): void {
  attempts.clear();
}
