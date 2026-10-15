/**
 * Idempotent seeding: the eight song categories (upserted on every boot) and
 * the default admin placeholder (only when ADMIN_GOOGLE_EMAIL is configured).
 */

import { randomUUID } from "node:crypto";
import type { Db } from "@/lib/db/index";
import { SEED_CATEGORIES } from "@/lib/db/schema";
import { nowIso } from "@/lib/db/queries/common";

/**
 * Insert or refresh the canonical categories. Safe to run repeatedly.
 * Custom categories created by admins are left untouched.
 */
export function seedCategories(db: Db): void {
  const upsert = db.prepare(/* sql */ `
    INSERT INTO categories (id, slug, name_en, name_hi, sort_order, created_at, updated_at)
    VALUES (@id, @slug, @nameEn, @nameHi, @sortOrder, @now, @now)
    ON CONFLICT (slug) DO UPDATE SET
      name_en    = excluded.name_en,
      name_hi    = excluded.name_hi,
      sort_order = excluded.sort_order,
      updated_at = excluded.updated_at
  `);
  const now = nowIso();
  const run = db.transaction(() => {
    for (const category of SEED_CATEGORIES) {
      upsert.run({ ...category, now });
    }
  });
  run();
}

/**
 * Create the default admin account placeholder for `ADMIN_GOOGLE_EMAIL`.
 *
 * The row uses a synthetic google_id until the real Google account signs in;
 * at sign-in the account is linked by email (see upsertUserFromGoogle) and
 * the admin role takes effect. No password or credential is ever stored.
 */
export function seedAdminPlaceholder(db: Db): boolean {
  const email = process.env.ADMIN_GOOGLE_EMAIL?.trim().toLowerCase();
  if (!email) return false;
  const existing = db
    .prepare("SELECT id FROM users WHERE email = ?")
    .get(email) as { id: string } | undefined;
  if (existing) return false;
  const now = nowIso();
  db.prepare(
    /* sql */ `
      INSERT INTO users (id, google_id, email, name, image, role, created_at, updated_at)
      VALUES (@id, @googleId, @email, @name, NULL, 'admin', @now, @now)
    `,
  ).run({
    id: randomUUID(),
    googleId: `seed:${email}`,
    email,
    name: "Site administrator",
    now,
  });
  return true;
}
