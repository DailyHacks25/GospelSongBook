/**
 * Promote or demote a Google account's role.
 *
 *   npm run db:promote-admin -- you@example.com
 *   npm run db:demote-admin  -- someone@example.com
 *
 * If the account has not signed in yet, a placeholder row is created and the
 * role is applied when the account is linked at first sign-in (by email).
 */

import "dotenv/config";
import { closeDb, getDb, resolveDatabasePath } from "../src/lib/db/index";
import { setUserRole } from "../src/lib/db/queries/users";
import type { Role } from "../src/lib/types";

function main(): void {
  const [command, ...rest] = process.argv.slice(2);
  const mode: Role | null =
    command === "promote" ? "admin" : command === "demote" ? "user" : null;
  if (!mode) {
    console.error("Usage: tsx scripts/set-role.ts <promote|demote> <email>");
    process.exit(1);
  }
  const email = rest[0]?.trim().toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    console.error("Error: a valid email address is required.");
    process.exit(1);
  }

  const dbPath = resolveDatabasePath();
  console.log(`[set-role] database: ${dbPath}`);
  const user = setUserRole(getDb(), email, mode);
  if (user) {
    console.log(`[set-role] ${user.email} is now "${user.role}" (id: ${user.id})`);
    if (mode === "admin") {
      console.log(
        "[set-role] That Google account will have admin access next time it signs in.\n" +
          "[set-role] If ADMIN_GOOGLE_EMAIL points elsewhere, update it so it names your own account.",
      );
    }
  } else {
    console.error("[set-role] failed to set role");
    process.exit(1);
  }
  closeDb();
}

main();
