/**
 * Idempotent seeding: the eight song categories (upserted on every boot) and
 * the default admin account (email + password, only when missing).
 *
 * Defaults: admin@example.com / admin123 — override with ADMIN_EMAIL and
 * ADMIN_PASSWORD. CHANGE THESE IMMEDIATELY in any shared deployment.
 */

import type { Db } from "@/lib/db/index";
import { SEED_CATEGORIES, DEFAULT_ADMIN_EMAIL, DEFAULT_ADMIN_PASSWORD } from "@/lib/db/schema";
import { nowIso } from "@/lib/db/queries/common";
import { getUserByEmail, upsertUserWithPassword } from "@/lib/db/queries/users";

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

export function resolveAdminCredentials(): { email: string; password: string } {
  return {
    email: (process.env.ADMIN_EMAIL ?? DEFAULT_ADMIN_EMAIL).trim().toLowerCase(),
    password: process.env.ADMIN_PASSWORD ?? DEFAULT_ADMIN_PASSWORD,
  };
}

/**
 * Ensure the default admin account exists. The password is only set when the
 * account is first created (or when it exists without one) — rotating
 * ADMIN_PASSWORD later does not silently overwrite a custom password;
 * use `npm run db:create-user` for that.
 */
export function seedAdminAccount(db: Db): { created: boolean; email: string } {
  const { email, password } = resolveAdminCredentials();
  const existing = getUserByEmail(db, email);
  if (existing && existing.role === "admin") {
    // Make sure the account can actually sign in (e.g. a placeholder row).
    const row = db
      .prepare("SELECT password_hash FROM users WHERE id = ?")
      .get(existing.id) as { password_hash: string | null } | undefined;
    if (!row?.password_hash) {
      upsertUserWithPassword(db, { email, password, role: "admin", name: existing.name });
    }
    return { created: false, email };
  }
  upsertUserWithPassword(db, {
    email,
    password,
    role: "admin",
    name: "Site administrator",
  });
  return { created: !existing, email };
}
