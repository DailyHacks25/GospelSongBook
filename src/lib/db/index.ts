/**
 * Database connection management.
 *
 * One `better-sqlite3` connection per process (it is synchronous and
 * thread-safe for our usage). The schema is applied idempotently on first
 * open, and the canonical seed data is upserted so a brand-new database is
 * immediately usable — including ephemeral filesystems (see README,
 * "SQLite on Vercel").
 */

import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { DDL } from "@/lib/db/schema";
import { seedCategories, seedAdminAccount } from "@/lib/db/seed";

export type Db = Database.Database;

/**
 * Resolve the SQLite file location.
 * Priority: explicit DATABASE_PATH → /tmp on Vercel → ./data/app.db locally.
 */
export function resolveDatabasePath(): string {
  const configured = process.env.DATABASE_PATH?.trim();
  if (configured) return configured;
  if (process.env.VERCEL) return "/tmp/worshipjesuschrist.db";
  return path.join(process.cwd(), "data", "app.db");
}

/** Apply schema + seed data to any connection (also used by tests with :memory:). */
export function initializeDatabase(db: Db): void {
  db.exec("PRAGMA foreign_keys = ON;");
  let version = db.pragma("user_version", { simple: true }) as number;
  if (version < 1) {
    db.exec(DDL);
    db.pragma("user_version = 1");
    version = 1;
  }
  if (version < 2) {
    // v2: password_hash for email+password sign-in.
    const columns = db.prepare("PRAGMA table_info(users)").all() as { name: string }[];
    if (!columns.some((column) => column.name === "password_hash")) {
      db.exec("ALTER TABLE users ADD COLUMN password_hash TEXT;");
    }
    db.pragma("user_version = 2");
  }
  seedCategories(db);
  seedAdminAccount(db);
}

let instance: Db | null = null;

export function getDb(): Db {
  if (instance) return instance;
  const filePath = resolveDatabasePath();
  if (filePath !== ":memory:") {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
  }
  const db = new Database(filePath);
  if (filePath !== ":memory:") {
    // WAL gives better concurrent read behaviour for the web server.
    db.pragma("journal_mode = WAL");
  }
  db.pragma("busy_timeout = 5000");
  initializeDatabase(db);
  instance = db;
  return instance;
}

/** Test helper: drop the cached connection (e.g. after closing). */
export function closeDb(): void {
  if (instance) {
    instance.close();
    instance = null;
  }
}
