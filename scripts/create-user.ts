/**
 * Create or update an account with an email + password.
 *
 *   npm run db:create-user -- user@example.com 'StrongPass1'        # role: user
 *   npm run db:create-user -- boss@example.com  'StrongPass1' admin # role: admin
 *
 * If the email already exists, the password and role are updated — this is
 * also how you rotate the default admin password.
 */

import "dotenv/config";
import { closeDb, getDb, resolveDatabasePath } from "../src/lib/db/index";
import { upsertUserWithPassword } from "../src/lib/db/queries/users";
import { createAccountSchema } from "../src/lib/validation/auth";

function main(): void {
  const [email, password, role] = process.argv.slice(2);
  const parsed = createAccountSchema.safeParse({
    email,
    password,
    ...(role ? { role } : {}),
  });
  if (!parsed.success) {
    console.error("Usage: npm run db:create-user -- <email> <password> [admin|user]");
    for (const issue of parsed.error.issues) {
      console.error(`  - ${issue.message}`);
    }
    process.exit(1);
  }

  console.log(`[create-user] database: ${resolveDatabasePath()}`);
  const { user, created } = upsertUserWithPassword(getDb(), parsed.data);
  console.log(
    `[create-user] ${created ? "created" : "updated"} ${user.email} (role: ${user.role}, id: ${user.id})`,
  );
  closeDb();
}

main();
