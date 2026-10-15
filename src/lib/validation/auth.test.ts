import { describe, expect, it } from "vitest";
import {
  createAccountSchema,
  credentialsSchema,
  newPasswordSchema,
  PASSWORD_MIN,
} from "@/lib/validation/auth";

describe("credentials validation", () => {
  it("accepts valid sign-in credentials", () => {
    const result = credentialsSchema.safeParse({
      email: "Admin@Example.com",
      password: "admin123",
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.email).toBe("admin@example.com");
  });

  it("rejects invalid emails and empty passwords", () => {
    expect(credentialsSchema.safeParse({ email: "not-an-email", password: "x" }).success).toBe(false);
    expect(credentialsSchema.safeParse({ email: "a@b.co", password: "" }).success).toBe(false);
    expect(credentialsSchema.safeParse({ email: "", password: "x" }).success).toBe(false);
    expect(credentialsSchema.safeParse({ password: "x" }).success).toBe(false);
    expect(credentialsSchema.safeParse({ email: "a@b.co" }).success).toBe(false);
    expect(
      credentialsSchema.safeParse({ email: "a@b.co", password: "x".repeat(129) }).success,
    ).toBe(false);
  });

  it("trims and lowercases emails", () => {
    const result = credentialsSchema.safeParse({ email: "  User@Example.COM ", password: "pw123456" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.email).toBe("user@example.com");
  });

  it("enforces a minimum length for NEW passwords", () => {
    expect(newPasswordSchema.safeParse("x".repeat(PASSWORD_MIN - 1)).success).toBe(false);
    expect(newPasswordSchema.safeParse("x".repeat(PASSWORD_MIN)).success).toBe(true);
    // …but sign-in still accepts short legacy passwords.
    expect(credentialsSchema.safeParse({ email: "a@b.co", password: "short" }).success).toBe(true);
  });

  it("validates account creation payloads", () => {
    const result = createAccountSchema.safeParse({
      email: "member@example.com",
      password: "StrongPass1",
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.role).toBe("user");

    const admin = createAccountSchema.safeParse({
      email: "boss@example.com",
      password: "StrongPass1",
      role: "admin",
    });
    expect(admin.success).toBe(true);
    if (admin.success) expect(admin.data.role).toBe("admin");

    expect(
      createAccountSchema.safeParse({ email: "x@y.co", password: "short", role: "admin" }).success,
    ).toBe(false);
    expect(
      createAccountSchema.safeParse({ email: "x@y.co", password: "StrongPass1", role: "root" })
        .success,
    ).toBe(false);
  });
});
