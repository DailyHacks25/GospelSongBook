/**
 * Auth.js (NextAuth v5) configuration — email + password sign-in.
 *
 * Accounts live in SQLite (`users.password_hash` holds a salted scrypt hash).
 * The JWT carries the local user id and role so session reads are cheap, and
 * the role is re-synced from the database on every session check so demotions
 * take effect promptly.
 *
 * Security defaults:
 *   - JWT session strategy (no client-readable session store),
 *   - httpOnly, SameSite=Lax, Secure cookies in production,
 *   - a required AUTH_SECRET in production,
 *   - scrypt-hashed passwords with constant-time verification,
 *   - per-account login rate limiting against brute force.
 */

import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import type { NextAuthConfig } from "next-auth";
import { DUMMY_PASSWORD_HASH, verifyPassword } from "@/lib/auth/password";
import {
  isLoginAllowed,
  recordLoginFailure,
  resetLoginFailures,
} from "@/lib/auth/rate-limit";
import { credentialsSchema } from "@/lib/validation/auth";
import { getDb } from "@/lib/db/index";
import { getUserByEmail, getUserById } from "@/lib/db/queries/users";
import type { Role } from "@/lib/types";

function assertProductionSecret(): void {
  // Fail fast when the server actually runs without a secret — but never
  // during `next build` (module evaluation happens before env is guaranteed).
  if (
    process.env.NODE_ENV === "production" &&
    process.env.NEXT_PHASE !== "phase-production-build" &&
    !process.env.AUTH_SECRET
  ) {
    throw new Error(
      "AUTH_SECRET is not set. Generate one with `npx auth secret` (or `openssl rand -base64 32`) " +
        "and add it to your environment variables (see .env.example).",
    );
  }
}

assertProductionSecret();

export const authConfig: NextAuthConfig = {
  providers: [
    Credentials({
      id: "credentials",
      name: "Email and password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = credentialsSchema.safeParse(credentials);
        if (!parsed.success) return null;
        const { email, password } = parsed.data;

        if (!isLoginAllowed(email)) return null;

        // Look up the stored hash and verify. On unknown accounts we still
        // run one hash comparison against a dummy to keep timing flat.
        const db = getDb();
        const user = getUserByEmail(db, email);
        const storedHash = user
          ? (
              db
                .prepare("SELECT password_hash FROM users WHERE id = ?")
                .get(user.id) as { password_hash: string | null } | undefined
            )?.password_hash ?? null
          : null;

        const ok =
          user && storedHash
            ? verifyPassword(password, storedHash)
            : (verifyPassword(password, DUMMY_PASSWORD_HASH), false);

        if (!ok || !user) {
          recordLoginFailure(email);
          return null;
        }
        resetLoginFailures(email);
        return { id: user.id, email: user.email, name: user.name, role: user.role };
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 7 * 24 * 60 * 60, // 7 days
    updateAge: 24 * 60 * 60,
  },
  cookies: {
    sessionToken: {
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
  pages: {
    signIn: "/en/signin",
    error: "/en/signin",
  },
  trustHost: true,
  callbacks: {
    async signIn({ user }) {
      // Credentials authorize() already validated the account.
      return Boolean(user?.id);
    },
    async jwt({ token, user, trigger }) {
      if (user) {
        // Sign-in: anchor the token to the local user row.
        token.userId = String(user.id);
        token.role = (user.role as Role | undefined) ?? "user";
        return token;
      }
      try {
        // Re-sync role/name on every use (one indexed lookup) so that
        // admin promotions and demotions apply on the next request.
        if (token.userId) {
          const fresh = getUserById(getDb(), String(token.userId));
          if (fresh) {
            token.role = fresh.role;
            token.name = fresh.name;
          }
        }
      } catch {
        // If the database is momentarily unavailable keep the existing claims;
        // route-level guards re-check the role against the database.
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = String(token.userId ?? "");
        session.user.role = (token.role as Role | undefined) ?? "user";
      }
      return session;
    },
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
