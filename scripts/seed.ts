/**
 * Seed script: creates/updates the SQLite database with the eight song
 * categories and the default admin account (email + password).
 *
 *   npm run db:seed
 *
 * Idempotent — safe to run repeatedly. Defaults: admin@example.com / admin123
 * (override with ADMIN_EMAIL / ADMIN_PASSWORD — change these immediately in
 * any shared deployment).
 */

import "dotenv/config";
import { closeDb, getDb, resolveDatabasePath } from "../src/lib/db/index";
import { seedAdminAccount, seedCategories } from "../src/lib/db/seed";
import { SEED_CATEGORIES } from "../src/lib/db/schema";
import { listCategories } from "../src/lib/db/queries/categories";

function main(): void {
  const dbPath = resolveDatabasePath();
  console.log(`[seed] database: ${dbPath}`);
  const db = getDb();

  seedCategories(db);
  const categories = listCategories(db);
  console.log(`[seed] categories: ${categories.length} (${SEED_CATEGORIES.length} canonical)`);

  const { created, email } = seedAdminAccount(db);
  if (created) {
    console.log(`[seed] admin account created: ${email}`);
    console.log(
      "[seed] Default password: the value of ADMIN_PASSWORD (default \"admin123\").\n" +
        "[seed] IMPORTANT: change these credentials immediately:\n" +
        "       npm run db:create-user -- " + email + " '<new-strong-password>' admin",
    );
  } else {
    console.log(`[seed] admin account ready: ${email}`);
    console.log("[seed] (password left unchanged — rotate it with db:create-user)");
  }

  closeDb();
  console.log("[seed] done.");
}

main();
