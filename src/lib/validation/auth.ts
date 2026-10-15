/**
 * Credential validation for the sign-in boundary and account scripts.
 */

import { z } from "zod";
import { stripControlChars } from "@/lib/validation/common";

export const PASSWORD_MIN = 8;
export const PASSWORD_MAX = 128;

export const emailSchema = z
  .string({ required_error: "Email is required." })
  .transform((v) => stripControlChars(v).trim().toLowerCase())
  .pipe(
    z
      .string()
      .min(1, "Email is required.")
      .max(254, "Email must be at most 254 characters.")
      .email("Enter a valid email address."),
  );

export const passwordSchema = z
  .string({ required_error: "Password is required." })
  .min(1, "Password is required.")
  .max(PASSWORD_MAX, `Password must be at most ${PASSWORD_MAX} characters.`);

/** Strict policy for *creating* or rotating passwords. */
export const newPasswordSchema = z
  .string({ required_error: "Password is required." })
  .min(PASSWORD_MIN, `Password must be at least ${PASSWORD_MIN} characters.`)
  .max(PASSWORD_MAX, `Password must be at most ${PASSWORD_MAX} characters.`);

/** Sign-in payload (loose password length — existing accounts vary). */
export const credentialsSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});
export type CredentialsInput = z.infer<typeof credentialsSchema>;

/** Account creation payload (scripts + admin tooling). */
export const createAccountSchema = z.object({
  email: emailSchema,
  password: newPasswordSchema,
  name: z
    .string()
    .max(80, "Name must be at most 80 characters.")
    .transform((v) => stripControlChars(v).trim())
    .optional(),
  role: z.enum(["admin", "user"]).optional().default("user"),
});
export type CreateAccountInput = z.infer<typeof createAccountSchema>;
