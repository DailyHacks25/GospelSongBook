import { describe, expect, it } from "vitest";
import { DUMMY_PASSWORD_HASH, hashPassword, verifyPassword } from "@/lib/auth/password";

describe("password hashing", () => {
  it("hashes and verifies a password (round trip)", () => {
    const stored = hashPassword("correct horse battery staple");
    expect(stored).toMatch(/^scrypt\$16384\$8\$1\$[0-9a-f]{32}\$[0-9a-f]{128}$/);
    expect(verifyPassword("correct horse battery staple", stored)).toBe(true);
  });

  it("rejects the wrong password", () => {
    const stored = hashPassword("admin123");
    expect(verifyPassword("admin124", stored)).toBe(false);
    expect(verifyPassword("", stored)).toBe(false);
    expect(verifyPassword("ADMIN123", stored)).toBe(false);
  });

  it("uses a fresh random salt per hash", () => {
    const a = hashPassword("same-password");
    const b = hashPassword("same-password");
    expect(a).not.toBe(b);
    // Both still verify.
    expect(verifyPassword("same-password", a)).toBe(true);
    expect(verifyPassword("same-password", b)).toBe(true);
  });

  it("rejects malformed stored values without throwing", () => {
    for (const stored of [
      null,
      undefined,
      "",
      "not-a-hash",
      "scrypt$16384$8$1$short$deadbeef",
      "bcrypt$16384$8$1$0123456789abcdef0123456789abcdef$" + "a".repeat(128),
      "scrypt$16384$8$1$" + "g".repeat(32) + "$" + "a".repeat(128),
      "scrypt$16384$8$1$" + "a".repeat(32) + "$" + "z".repeat(128),
      "scrypt$0$8$1$" + "a".repeat(32) + "$" + "a".repeat(128),
      "scrypt$16384$8$1$" + "a".repeat(32) + "$" + "ab",
    ]) {
      expect(verifyPassword("anything", stored as string | null)).toBe(false);
    }
  });

  it("rejects empty passwords", () => {
    const stored = hashPassword("admin123");
    expect(verifyPassword("", stored)).toBe(false);
    expect(() => hashPassword("")).toThrow();
  });

  it("supports fast params for tests while keeping the format", () => {
    const stored = hashPassword("quick", { N: 1024, r: 8, p: 1 });
    expect(stored.startsWith("scrypt$1024$8$1$")).toBe(true);
    expect(verifyPassword("quick", stored)).toBe(true);
  });

  it("exposes a dummy hash for timing equalization", () => {
    expect(DUMMY_PASSWORD_HASH).toMatch(/^scrypt\$/);
    // It must never verify as any real password we use.
    expect(verifyPassword("admin123", DUMMY_PASSWORD_HASH)).toBe(false);
    expect(verifyPassword("", DUMMY_PASSWORD_HASH)).toBe(false);
  });
});
