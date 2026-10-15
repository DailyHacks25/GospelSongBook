import type { NextRequest } from "next/server";
import {
  apiError,
  apiSuccess,
  assertSameOrigin,
  readJsonBody,
  requireAdmin,
} from "@/lib/auth/guards";
import { getDb } from "@/lib/db/index";
import {
  countSongsInCategory,
  deleteCategory,
  getCategoryById,
  getCategoryBySlug,
  updateCategory,
} from "@/lib/db/queries/categories";
import { AppError } from "@/lib/errors";
import { updateCategorySchema } from "@/lib/validation/categories";
import { fieldErrors } from "@/lib/validation/common";

export const runtime = "nodejs";

interface RouteContext {
  params: Promise<{ id: string }>;
}

/** PATCH /api/categories/:id — admin updates a category. */
export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    assertSameOrigin(request);
    await requireAdmin();
    const { id } = await context.params;
    const db = getDb();
    const existing = getCategoryById(db, id);
    if (!existing) throw new AppError("not_found", "Category not found.");

    const body = await readJsonBody(request);
    const parsed = updateCategorySchema.safeParse(body);
    if (!parsed.success) {
      throw new AppError("validation_error", "Please check the highlighted fields.", {
        fields: fieldErrors(parsed.error),
      });
    }
    if (parsed.data.slug && parsed.data.slug !== existing.slug) {
      const clash = getCategoryBySlug(db, parsed.data.slug);
      if (clash && clash.id !== id) {
        throw new AppError("conflict", "A category with this slug already exists.", {
          fields: { slug: "This slug is already in use." },
        });
      }
    }
    const category = updateCategory(db, id, parsed.data);
    return apiSuccess({ category });
  } catch (error) {
    return apiError(error);
  }
}

/** DELETE /api/categories/:id — admin deletes a category (only when empty). */
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    assertSameOrigin(request);
    await requireAdmin();
    const { id } = await context.params;
    const db = getDb();
    const existing = getCategoryById(db, id);
    if (!existing) throw new AppError("not_found", "Category not found.");
    if (countSongsInCategory(db, id) > 0) {
      throw new AppError("conflict", "This category still contains songs. Move or delete them first.");
    }
    deleteCategory(db, id);
    return apiSuccess({ deleted: true });
  } catch (error) {
    return apiError(error);
  }
}
