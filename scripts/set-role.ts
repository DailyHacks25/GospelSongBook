/**
 * Promote or demote an existing account.
 *
 *   npm run db:promote-admin -- you@example.com
 *   npm run db:demote-admin  -- someone@example.com
 *
 * The account must already exist — create it first with:
 *   npm run db:create-user -- <email> <password> [admin|user]
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

  console.log(`[set-role] database: ${resolveDatabasePath()}`);
  const user = setUserRole(getDb(), email, mode);
  if (!user) {
    console.error(`[set-role] no account for ${email}. Create one first:`);
    console.error(`           npm run db:create-user -- ${email} '<password>' ${mode}`);
    process.exit(1);
  }
  console.log(`[set-role] ${user.email} is now "${user.role}" (id: ${user.id})`);
  closeDb();
}

main();
