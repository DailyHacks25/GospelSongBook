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
import { DDL, SCHEMA_VERSION } from "@/lib/db/schema";
import { seedCategories, seedAdminPlaceholder } from "@/lib/db/seed";

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
  const version = db.pragma("user_version", { simple: true }) as number;
  if (version < SCHEMA_VERSION) {
    db.exec(DDL);
    db.pragma(`user_version = ${SCHEMA_VERSION}`);
  }
  seedCategories(db);
  seedAdminPlaceholder(db);
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
