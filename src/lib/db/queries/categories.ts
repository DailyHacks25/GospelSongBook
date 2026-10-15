/**
 * Typed category queries over better-sqlite3.
 */

import { randomUUID } from "node:crypto";
import type { Db } from "@/lib/db/index";
import { nowIso } from "@/lib/db/queries/common";
import type { Category } from "@/lib/types";
import type { CreateCategoryInput, UpdateCategoryInput } from "@/lib/validation/categories";

interface CategoryRow {
  id: string;
  slug: string;
  name_en: string;
  name_hi: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

function mapCategory(row: CategoryRow): Category {
  return {
    id: row.id,
    slug: row.slug,
    nameEn: row.name_en,
    nameHi: row.name_hi,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function listCategories(db: Db): Category[] {
  const rows = db
    .prepare("SELECT * FROM categories ORDER BY sort_order ASC, name_en ASC")
    .all() as CategoryRow[];
  return rows.map(mapCategory);
}

export function getCategoryById(db: Db, id: string): Category | null {
  const row = db.prepare("SELECT * FROM categories WHERE id = ?").get(id) as CategoryRow | undefined;
  return row ? mapCategory(row) : null;
}

export function getCategoryBySlug(db: Db, slug: string): Category | null {
  const row = db.prepare("SELECT * FROM categories WHERE slug = ?").get(slug) as
    | CategoryRow
    | undefined;
  return row ? mapCategory(row) : null;
}

export function createCategory(db: Db, input: CreateCategoryInput): Category {
  const id = randomUUID();
  const now = nowIso();
  db.prepare(
    /* sql */ `
      INSERT INTO categories (id, slug, name_en, name_hi, sort_order, created_at, updated_at)
      VALUES (@id, @slug, @nameEn, @nameHi, @sortOrder, @now, @now)
    `,
  ).run({
    id,
    slug: input.slug,
    nameEn: input.nameEn,
    nameHi: input.nameHi,
    sortOrder: input.sortOrder ?? 0,
    now,
  });
  return getCategoryById(db, id)!;
}

export function updateCategory(db: Db, id: string, input: UpdateCategoryInput): Category | null {
  const existing = getCategoryById(db, id);
  if (!existing) return null;
  const next = {
    slug: input.slug ?? existing.slug,
    nameEn: input.nameEn ?? existing.nameEn,
    nameHi: input.nameHi ?? existing.nameHi,
    sortOrder: input.sortOrder ?? existing.sortOrder,
  };
  db.prepare(
    /* sql */ `
      UPDATE categories
      SET slug = @slug, name_en = @nameEn, name_hi = @nameHi,
          sort_order = @sortOrder, updated_at = @now
      WHERE id = @id
    `,
  ).run({ id, ...next, now: nowIso() });
  return getCategoryById(db, id);
}

export function countSongsInCategory(db: Db, categoryId: string): number {
  const row = db
    .prepare("SELECT COUNT(*) AS n FROM songs WHERE category_id = ?")
    .get(categoryId) as { n: number };
  return row.n;
}

export function deleteCategory(db: Db, id: string): boolean {
  const result = db.prepare("DELETE FROM categories WHERE id = ?").run(id);
  return result.changes > 0;
}
