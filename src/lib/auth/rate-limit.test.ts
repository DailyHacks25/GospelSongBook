import { afterEach, describe, expect, it } from "vitest";
import {
  clearLoginAttempts,
  isLoginAllowed,
  normalizeLoginKey,
  recordLoginFailure,
  resetLoginFailures,
} from "@/lib/auth/rate-limit";

afterEach(() => clearLoginAttempts());

describe("login rate limiting", () => {
  it("allows sign-in when there are no failures", () => {
    expect(isLoginAllowed("user@example.com")).toBe(true);
  });

  it("locks the account after too many failures", () => {
    let now = 0;
    const options = { now: () => now, maxFailures: 3, windowMs: 1000, lockoutMs: 5000 };
    for (let i = 0; i < 3; i++) {
      expect(isLoginAllowed("user@example.com", options)).toBe(true);
      recordLoginFailure("user@example.com", options);
    }
    expect(isLoginAllowed("user@example.com", options)).toBe(false);

    // Locked even later within the lockout window.
    now = 4000;
    expect(isLoginAllowed("user@example.com", options)).toBe(false);

    // After the lockout expires, attempts are allowed again.
    now = 5001;
    expect(isLoginAllowed("user@example.com", options)).toBe(true);
  });

  it("counts failures per account, not globally", () => {
    const options = { maxFailures: 2, windowMs: 1000, lockoutMs: 5000 };
    recordLoginFailure("a@example.com", options);
    recordLoginFailure("a@example.com", options);
    expect(isLoginAllowed("a@example.com", options)).toBe(false);
    expect(isLoginAllowed("b@example.com", options)).toBe(true);
  });

  it("normalises keys (case and whitespace)", () => {
    expect(normalizeLoginKey("  User@Example.COM ")).toBe("user@example.com");
    const options = { maxFailures: 1, windowMs: 1000, lockoutMs: 5000 };
    recordLoginFailure("user@example.com", options);
    expect(isLoginAllowed("USER@example.com", options)).toBe(false);
  });

  it("forgets old failures after the window", () => {
    let now = 0;
    const options = { now: () => now, maxFailures: 2, windowMs: 1000, lockoutMs: 5000 };
    recordLoginFailure("user@example.com", options);
    now = 1500; // window passed without reaching the lockout threshold
    recordLoginFailure("user@example.com", options);
    expect(isLoginAllowed("user@example.com", options)).toBe(true);
  });

  it("resets on successful sign-in", () => {
    const options = { maxFailures: 2, windowMs: 1000, lockoutMs: 5000 };
    recordLoginFailure("user@example.com", options);
    recordLoginFailure("user@example.com", options);
    expect(isLoginAllowed("user@example.com", options)).toBe(false);
    resetLoginFailures("user@example.com");
    expect(isLoginAllowed("user@example.com", options)).toBe(true);
  });
});
