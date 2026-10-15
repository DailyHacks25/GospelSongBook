/**
 * Auth.js (NextAuth v5) configuration.
 *
 * Google sign-in only. Users and roles live in SQLite (see
 * `src/lib/db/queries/users.ts`); the JWT carries the local user id and role
 * so session reads are cheap, and the role is re-synced from the database on
 * every session check so demotions take effect promptly.
 *
 * Security defaults:
 *   - JWT session strategy (no client-readable session store),
 *   - httpOnly, SameSite=Lax, Secure cookies in production,
 *   - a required AUTH_SECRET in production,
 *   - no credentials provider.
 */

import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import type { NextAuthConfig } from "next-auth";
import { getDb } from "@/lib/db/index";
import {
  getUserByEmail,
  getUserByGoogleId,
  getUserById,
  upsertUserFromGoogle,
} from "@/lib/db/queries/users";
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
    Google({
      clientId: process.env.AUTH_GOOGLE_ID ?? "",
      clientSecret: process.env.AUTH_GOOGLE_SECRET ?? "",
      authorization: {
        params: {
          scope: "openid email profile",
          // Always show the account picker so users can choose the right Google account.
          prompt: "select_account",
        },
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
    async signIn({ user, account, profile }) {
      if (!account || !profile) return false;
      const email = (user.email ?? (profile as { email?: string }).email ?? "")
        .trim()
        .toLowerCase();
      if (!email) return false;
      const googleId =
        account.providerAccountId ?? user.id ?? (profile as { sub?: string }).sub ?? "";
      if (!googleId) return false;
      const db = getDb();
      upsertUserFromGoogle(db, {
        googleId,
        email,
        name: user.name ?? email,
        image: user.image ?? null,
      });
      return true;
    },
    async jwt({ token, trigger }) {
      try {
        const db = getDb();
        if (!token.userId) {
          // First token after sign-in: map the Google identity to the local
          // user row (email first so the seeded admin placeholder is claimed).
          const user =
            (token.email ? getUserByEmail(db, token.email) : null) ??
            (token.sub ? getUserByGoogleId(db, token.sub) : null);
          if (user) {
            token.userId = user.id;
            token.role = user.role;
          }
        } else if (trigger !== "signIn") {
          // Re-sync role/name on every use (one indexed lookup) so that
          // admin promotions and demotions apply on the next request.
          const fresh = getUserById(db, String(token.userId));
          if (fresh) {
            token.role = fresh.role;
            token.name = fresh.name;
            token.picture = fresh.image ?? token.picture;
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
  events: {
    async signIn({ user }) {
      if (process.env.NODE_ENV !== "production" && user.email) {
        console.info(`[auth] sign-in: ${user.email}`);
      }
    },
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
