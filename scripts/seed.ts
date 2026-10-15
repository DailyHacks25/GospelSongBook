/**
 * Seed script: creates/updates the SQLite database with the eight song
 * categories and (optionally) the default admin placeholder.
 *
 *   npm run db:seed
 *
 * Idempotent — safe to run repeatedly.
 */

import "dotenv/config";
import { closeDb, getDb, resolveDatabasePath } from "../src/lib/db/index";
import { seedAdminPlaceholder, seedCategories } from "../src/lib/db/seed";
import { SEED_CATEGORIES } from "../src/lib/db/schema";
import { listCategories } from "../src/lib/db/queries/categories";
import { getUserByEmail } from "../src/lib/db/queries/users";

function main(): void {
  const dbPath = resolveDatabasePath();
  console.log(`[seed] database: ${dbPath}`);
  const db = getDb();

  seedCategories(db);
  const categories = listCategories(db);
  console.log(`[seed] categories: ${categories.length} (${SEED_CATEGORIES.length} canonical)`);

  const adminEmail = process.env.ADMIN_GOOGLE_EMAIL?.trim().toLowerCase();
  if (!adminEmail) {
    console.log(
      "[seed] ADMIN_GOOGLE_EMAIL is not set — no admin placeholder created.\n" +
        "       Set ADMIN_GOOGLE_EMAIL in .env, or later run:\n" +
        "       npm run db:promote-admin -- you@example.com",
    );
  } else {
    const before = getUserByEmail(db, adminEmail);
    seedAdminPlaceholder(db);
    const admin = getUserByEmail(db, adminEmail);
    if (admin && admin.googleId.startsWith("seed:")) {
      console.log(`[seed] admin placeholder ready for ${adminEmail}`);
      console.log(
        "[seed] IMPORTANT: sign in with that Google account to claim admin access,\n" +
          "       and change ADMIN_GOOGLE_EMAIL if it is not your own address.",
      );
    } else if (admin && !before) {
      console.log(`[seed] admin placeholder created for ${adminEmail}`);
    } else if (admin) {
      console.log(`[seed] admin account ${adminEmail} exists (linked Google id: ${admin.googleId})`);
    }
  }

  closeDb();
  console.log("[seed] done.");
}

main();
