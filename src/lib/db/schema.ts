/**
 * SQLite schema (DDL) and canonical seed data.
 * Applied by `initializeDatabase` (see `src/lib/db/index.ts`).
 */

import type { CategorySlug } from "@/lib/types";

export const SCHEMA_VERSION = 2;

export const DDL = /* sql */ `
CREATE TABLE IF NOT EXISTS users (
  id            TEXT PRIMARY KEY,
  google_id     TEXT NOT NULL UNIQUE,
  email         TEXT NOT NULL UNIQUE,
  name          TEXT NOT NULL,
  image         TEXT,
  role          TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  password_hash TEXT,
  created_at    TEXT NOT NULL,
  updated_at    TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS categories (
  id          TEXT PRIMARY KEY,
  slug        TEXT NOT NULL UNIQUE,
  name_en     TEXT NOT NULL,
  name_hi     TEXT NOT NULL,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  created_at  TEXT NOT NULL,
  updated_at  TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS songs (
  id               TEXT PRIMARY KEY,
  title            TEXT NOT NULL,
  language         TEXT NOT NULL CHECK (language IN ('en', 'hi')),
  category_id      TEXT NOT NULL REFERENCES categories (id) ON DELETE RESTRICT,
  lyrics           TEXT NOT NULL,
  status           TEXT NOT NULL DEFAULT 'pending'
                   CHECK (status IN ('pending', 'approved', 'rejected')),
  author_id        TEXT NOT NULL REFERENCES users (id) ON DELETE RESTRICT,
  background_image TEXT,
  review_note      TEXT,
  reviewed_by      TEXT REFERENCES users (id) ON DELETE SET NULL,
  reviewed_at      TEXT,
  created_at       TEXT NOT NULL,
  updated_at       TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_songs_status_language ON songs (status, language);
CREATE INDEX IF NOT EXISTS idx_songs_category        ON songs (category_id);
CREATE INDEX IF NOT EXISTS idx_songs_author          ON songs (author_id);
CREATE INDEX IF NOT EXISTS idx_songs_title           ON songs (title);
CREATE INDEX IF NOT EXISTS idx_users_email           ON users (email);
`;

export interface SeedCategory {
  id: string;
  slug: CategorySlug;
  nameEn: string;
  nameHi: string;
  sortOrder: number;
}

/** Default admin sign-in — CHANGE THESE IMMEDIATELY (see README). */
export const DEFAULT_ADMIN_EMAIL = "admin@example.com";
export const DEFAULT_ADMIN_PASSWORD = "admin123";

/**
 * The eight gospel song categories, with stable IDs and bilingual names.
 * These rows are upserted on every boot so a fresh database always has them.
 */
export const SEED_CATEGORIES: readonly SeedCategory[] = [
  {
    id: "0b0f8f5e-6a2b-4c1d-9e3f-1a2b3c4d5e01",
    slug: "worship",
    nameEn: "Worship",
    nameHi: "आराधना",
    sortOrder: 10,
  },
  {
    id: "0b0f8f5e-6a2b-4c1d-9e3f-1a2b3c4d5e02",
    slug: "prayer-songs",
    nameEn: "Prayer Songs",
    nameHi: "प्रार्थना गीत",
    sortOrder: 20,
  },
  {
    id: "0b0f8f5e-6a2b-4c1d-9e3f-1a2b3c4d5e03",
    slug: "easter",
    nameEn: "Easter",
    nameHi: "ईस्टर",
    sortOrder: 30,
  },
  {
    id: "0b0f8f5e-6a2b-4c1d-9e3f-1a2b3c4d5e04",
    slug: "good-friday",
    nameEn: "Good Friday",
    nameHi: "गुड फ्राइडे",
    sortOrder: 40,
  },
  {
    id: "0b0f8f5e-6a2b-4c1d-9e3f-1a2b3c4d5e05",
    slug: "palm-sunday",
    nameEn: "Palm Sunday",
    nameHi: "पाम संडे",
    sortOrder: 50,
  },
  {
    id: "0b0f8f5e-6a2b-4c1d-9e3f-1a2b3c4d5e06",
    slug: "christmas-songs",
    nameEn: "Christmas Songs",
    nameHi: "क्रिसमस गीत",
    sortOrder: 60,
  },
  {
    id: "0b0f8f5e-6a2b-4c1d-9e3f-1a2b3c4d5e07",
    slug: "bible-passage-songs",
    nameEn: "Bible Passage-Related Songs",
    nameHi: "बाइबल पद से जुड़े गीत",
    sortOrder: 70,
  },
  {
    id: "0b0f8f5e-6a2b-4c1d-9e3f-1a2b3c4d5e08",
    slug: "others",
    nameEn: "Others",
    nameHi: "अन्य",
    sortOrder: 80,
  },
] as const;
