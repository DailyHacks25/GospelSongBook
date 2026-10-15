/**
 * Typed user queries over better-sqlite3.
 */

import { randomUUID } from "node:crypto";
import type { Db } from "@/lib/db/index";
import { nowIso } from "@/lib/db/queries/common";
import type { Role, User } from "@/lib/types";

interface UserRow {
  id: string;
  google_id: string;
  email: string;
  name: string;
  image: string | null;
  role: Role;
  created_at: string;
  updated_at: string;
}

function mapUser(row: UserRow): User {
  return {
    id: row.id,
    googleId: row.google_id,
    email: row.email,
    name: row.name,
    image: row.image,
    role: row.role,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function getUserById(db: Db, id: string): User | null {
  const row = db.prepare("SELECT * FROM users WHERE id = ?").get(id) as UserRow | undefined;
  return row ? mapUser(row) : null;
}

export function getUserByEmail(db: Db, email: string): User | null {
  const row = db
    .prepare("SELECT * FROM users WHERE email = ?")
    .get(email.trim().toLowerCase()) as UserRow | undefined;
  return row ? mapUser(row) : null;
}

export function getUserByGoogleId(db: Db, googleId: string): User | null {
  const row = db.prepare("SELECT * FROM users WHERE google_id = ?").get(googleId) as
    | UserRow
    | undefined;
  return row ? mapUser(row) : null;
}

export interface GoogleProfile {
  googleId: string;
  email: string;
  name: string;
  image?: string | null;
}

/**
 * Link a Google sign-in to a local user.
 *
 * Order of resolution:
 *   1. Existing row with the same google_id → refresh profile fields.
 *   2. Existing row with the same email (e.g. the seeded admin placeholder)
 *      → claim it by storing the real google_id; role is preserved, which is
 *      how the seeded ADMIN_GOOGLE_EMAIL account becomes a real admin.
 *   3. Otherwise create a new `user`, or an `admin` when the address equals
 *      ADMIN_GOOGLE_EMAIL (belt-and-braces if seeding was skipped).
 */
export function upsertUserFromGoogle(db: Db, profile: GoogleProfile): User {
  const email = profile.email.trim().toLowerCase();
  const now = nowIso();

  const byGoogleId = getUserByGoogleId(db, profile.googleId);
  if (byGoogleId) {
    db.prepare(
      /* sql */ `
        UPDATE users
        SET email = @email, name = @name, image = @image, updated_at = @now
        WHERE id = @id
      `,
    ).run({
      id: byGoogleId.id,
      email,
      name: profile.name,
      image: profile.image ?? null,
      now,
    });
    return getUserById(db, byGoogleId.id)!;
  }

  const byEmail = getUserByEmail(db, email);
  if (byEmail) {
    db.prepare(
      /* sql */ `
        UPDATE users
        SET google_id = @googleId, name = @name, image = @image, updated_at = @now
        WHERE id = @id
      `,
    ).run({
      id: byEmail.id,
      googleId: profile.googleId,
      name: profile.name,
      image: profile.image ?? null,
      now,
    });
    return getUserById(db, byEmail.id)!;
  }

  const adminEmail = process.env.ADMIN_GOOGLE_EMAIL?.trim().toLowerCase();
  const role: Role = adminEmail && adminEmail === email ? "admin" : "user";
  const id = randomUUID();
  db.prepare(
    /* sql */ `
      INSERT INTO users (id, google_id, email, name, image, role, created_at, updated_at)
      VALUES (@id, @googleId, @email, @name, @image, @role, @now, @now)
    `,
  ).run({
    id,
    googleId: profile.googleId,
    email,
    name: profile.name,
    image: profile.image ?? null,
    role,
    now,
  });
  return getUserById(db, id)!;
}

/** Promote or demote an account (seed scripts + first-boot hardening). */
export function setUserRole(db: Db, email: string, role: Role): User | null {
  const normalized = email.trim().toLowerCase();
  const existing = getUserByEmail(db, normalized);
  const now = nowIso();
  if (existing) {
    db.prepare("UPDATE users SET role = ?, updated_at = ? WHERE id = ?").run(role, now, existing.id);
    return getUserById(db, existing.id);
  }
  // Create a placeholder row so the role is reserved before first sign-in.
  const id = randomUUID();
  db.prepare(
    /* sql */ `
      INSERT INTO users (id, google_id, email, name, image, role, created_at, updated_at)
      VALUES (@id, @googleId, @email, @name, NULL, @role, @now, @now)
    `,
  ).run({ id, googleId: `seed:${normalized}`, email: normalized, name: normalized, role, now });
  return getUserById(db, id);
}
