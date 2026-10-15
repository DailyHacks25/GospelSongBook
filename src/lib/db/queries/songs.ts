/**
 * Typed song queries over better-sqlite3.
 */

import { randomUUID } from "node:crypto";
import type { Db } from "@/lib/db/index";
import { escapeLike, nowIso } from "@/lib/db/queries/common";
import type {
  BackgroundImage,
  Category,
  Language,
  Song,
  SongStatus,
  SongWithRelations,
} from "@/lib/types";
import type { CreateSongInput, UpdateSongInput } from "@/lib/validation/songs";

interface SongRow {
  id: string;
  title: string;
  language: Language;
  category_id: string;
  lyrics: string;
  status: SongStatus;
  author_id: string;
  background_image: string | null;
  review_note: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
}

interface SongJoinRow extends SongRow {
  cat_id: string;
  cat_slug: string;
  cat_name_en: string;
  cat_name_hi: string;
  cat_sort_order: number;
  cat_created_at: string;
  cat_updated_at: string;
  author_name: string;
}

function parseBackgroundImage(raw: string | null): BackgroundImage | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as BackgroundImage;
    if (parsed && typeof parsed.photoId === "string" && typeof parsed.url === "string") {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

function mapCategoryFromJoin(row: SongJoinRow): Category {
  return {
    id: row.cat_id,
    slug: row.cat_slug,
    nameEn: row.cat_name_en,
    nameHi: row.cat_name_hi,
    sortOrder: row.cat_sort_order,
    createdAt: row.cat_created_at,
    updatedAt: row.cat_updated_at,
  };
}

function mapSong(row: SongRow): Song {
  return {
    id: row.id,
    title: row.title,
    language: row.language,
    categoryId: row.category_id,
    lyrics: row.lyrics,
    status: row.status,
    authorId: row.author_id,
    backgroundImage: parseBackgroundImage(row.background_image),
    reviewNote: row.review_note,
    reviewedBy: row.reviewed_by,
    reviewedAt: row.reviewed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapSongWithRelations(row: SongJoinRow): SongWithRelations {
  return {
    ...mapSong(row),
    category: mapCategoryFromJoin(row),
    author: { id: row.author_id, name: row.author_name },
  };
}

const JOIN_SELECT = /* sql */ `
  SELECT s.*,
         c.id AS cat_id, c.slug AS cat_slug, c.name_en AS cat_name_en, c.name_hi AS cat_name_hi,
         c.sort_order AS cat_sort_order, c.created_at AS cat_created_at, c.updated_at AS cat_updated_at,
         u.name AS author_name
  FROM songs s
  JOIN categories c ON c.id = s.category_id
  JOIN users u ON u.id = s.author_id
`;

export function createSong(db: Db, input: CreateSongInput, authorId: string): Song {
  const id = randomUUID();
  const now = nowIso();
  db.prepare(
    /* sql */ `
      INSERT INTO songs (id, title, language, category_id, lyrics, status, author_id,
                         background_image, review_note, reviewed_by, reviewed_at,
                         created_at, updated_at)
      VALUES (@id, @title, @language, @categoryId, @lyrics, 'pending', @authorId,
              NULL, NULL, NULL, NULL, @now, @now)
    `,
  ).run({
    id,
    title: input.title,
    language: input.language,
    categoryId: input.categoryId,
    lyrics: input.lyrics,
    authorId,
    now,
  });
  return getSongById(db, id)!;
}

export function getSongById(db: Db, id: string): Song | null {
  const row = db.prepare("SELECT * FROM songs WHERE id = ?").get(id) as SongRow | undefined;
  return row ? mapSong(row) : null;
}

export function getSongWithRelations(db: Db, id: string): SongWithRelations | null {
  const row = db.prepare(`${JOIN_SELECT} WHERE s.id = ?`).get(id) as SongJoinRow | undefined;
  return row ? mapSongWithRelations(row) : null;
}

export interface ListSongsFilter {
  /** Restrict to these statuses (visibility rules are applied by callers). */
  statuses?: readonly SongStatus[];
  language?: Language;
  categoryId?: string;
  categorySlug?: string;
  authorId?: string;
  /** Case-insensitive substring match on title or lyrics. */
  search?: string;
  limit?: number;
  offset?: number;
}

function buildWhere(filter: ListSongsFilter): { sql: string; params: Record<string, unknown> } {
  const clauses: string[] = [];
  const params: Record<string, unknown> = {};

  if (filter.statuses && filter.statuses.length > 0) {
    const keys = filter.statuses.map((status, i) => {
      params[`status_${i}`] = status;
      return `@status_${i}`;
    });
    clauses.push(`s.status IN (${keys.join(", ")})`);
  }
  if (filter.language) {
    clauses.push("s.language = @language");
    params.language = filter.language;
  }
  if (filter.categoryId) {
    clauses.push("s.category_id = @categoryId");
    params.categoryId = filter.categoryId;
  }
  if (filter.categorySlug) {
    clauses.push("c.slug = @categorySlug");
    params.categorySlug = filter.categorySlug;
  }
  if (filter.authorId) {
    clauses.push("s.author_id = @authorId");
    params.authorId = filter.authorId;
  }
  if (filter.search && filter.search.trim() !== "") {
    clauses.push(
      "(s.title LIKE @search ESCAPE '\\' OR s.lyrics LIKE @search ESCAPE '\\')",
    );
    params.search = `%${escapeLike(filter.search.trim())}%`;
  }

  return {
    sql: clauses.length > 0 ? `WHERE ${clauses.join(" AND ")}` : "",
    params,
  };
}

export function listSongs(db: Db, filter: ListSongsFilter = {}): SongWithRelations[] {
  const { sql: whereSql, params } = buildWhere(filter);
  const rows = db
    .prepare(
      `${JOIN_SELECT} ${whereSql}
       ORDER BY c.sort_order ASC, s.created_at DESC, s.title ASC
       LIMIT @limit OFFSET @offset`,
    )
    .all({ ...params, limit: filter.limit ?? 24, offset: filter.offset ?? 0 }) as SongJoinRow[];
  return rows.map(mapSongWithRelations);
}

export function countSongs(db: Db, filter: ListSongsFilter = {}): number {
  const { sql: whereSql, params } = buildWhere(filter);
  // count query joins categories for the slug filter
  const row = db
    .prepare(
      `SELECT COUNT(*) AS n
       FROM songs s
       JOIN categories c ON c.id = s.category_id
       ${whereSql}`,
    )
    .get(params) as { n: number };
  return row.n;
}

/** Aggregate counts per status — used by the admin dashboard. */
export function countSongsByStatus(db: Db): Record<SongStatus, number> {
  const rows = db
    .prepare("SELECT status, COUNT(*) AS n FROM songs GROUP BY status")
    .all() as { status: SongStatus; n: number }[];
  const out: Record<SongStatus, number> = { pending: 0, approved: 0, rejected: 0 };
  for (const row of rows) out[row.status] = row.n;
  return out;
}

/**
 * Apply a validated field update. Status changes must go through
 * `updateSongStatus` so review metadata stays consistent.
 */
export function updateSongFields(db: Db, id: string, input: UpdateSongInput): Song | null {
  const existing = getSongById(db, id);
  if (!existing) return null;
  const next = {
    title: input.title ?? existing.title,
    language: input.language ?? existing.language,
    categoryId: input.categoryId ?? existing.categoryId,
    lyrics: input.lyrics ?? existing.lyrics,
  };
  db.prepare(
    /* sql */ `
      UPDATE songs
      SET title = @title, language = @language, category_id = @categoryId,
          lyrics = @lyrics, updated_at = @now
      WHERE id = @id
    `,
  ).run({ id, ...next, now: nowIso() });
  return getSongById(db, id);
}

export function updateSongStatus(
  db: Db,
  id: string,
  status: SongStatus,
  options: { reviewedBy?: string | null; reviewNote?: string | null; clearReview?: boolean } = {},
): Song | null {
  const now = nowIso();
  if (options.clearReview) {
    db.prepare(
      /* sql */ `
        UPDATE songs
        SET status = @status, review_note = NULL, reviewed_by = NULL, reviewed_at = NULL,
            updated_at = @now
        WHERE id = @id
      `,
    ).run({ id, status, now });
  } else {
    db.prepare(
      /* sql */ `
        UPDATE songs
        SET status = @status,
            review_note = @reviewNote,
            reviewed_by = @reviewedBy,
            reviewed_at = @now,
            updated_at = @now
        WHERE id = @id
      `,
    ).run({
      id,
      status,
      reviewNote: options.reviewNote ?? null,
      reviewedBy: options.reviewedBy ?? null,
      now,
    });
  }
  return getSongById(db, id);
}

export function updateSongBackgroundImage(
  db: Db,
  id: string,
  image: BackgroundImage,
): Song | null {
  db.prepare(
    "UPDATE songs SET background_image = ?, updated_at = ? WHERE id = ?",
  ).run(JSON.stringify(image), nowIso(), id);
  return getSongById(db, id);
}

export function deleteSong(db: Db, id: string): boolean {
  const result = db.prepare("DELETE FROM songs WHERE id = ?").run(id);
  return result.changes > 0;
}
