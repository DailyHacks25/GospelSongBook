import type { NextRequest } from "next/server";
import {
  apiError,
  apiSuccess,
  assertSameOrigin,
  readJsonBody,
  requireAdmin,
} from "@/lib/auth/guards";
import { getDb } from "@/lib/db/index";
import { createCategory, getCategoryBySlug, listCategories } from "@/lib/db/queries/categories";
import { AppError } from "@/lib/errors";
import { createCategorySchema } from "@/lib/validation/categories";
import { fieldErrors } from "@/lib/validation/common";

export const runtime = "nodejs";

/** GET /api/categories — public list of categories. */
export async function GET() {
  try {
    return apiSuccess({ categories: listCategories(getDb()) });
  } catch (error) {
    return apiError(error);
  }
}

/** POST /api/categories — admin creates a category. */
export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    await requireAdmin();
    const body = await readJsonBody(request);
    const parsed = createCategorySchema.safeParse(body);
    if (!parsed.success) {
      throw new AppError("validation_error", "Please check the highlighted fields.", {
        fields: fieldErrors(parsed.error),
      });
    }
    const db = getDb();
    if (getCategoryBySlug(db, parsed.data.slug)) {
      throw new AppError("conflict", "A category with this slug already exists.", {
        fields: { slug: "This slug is already in use." },
      });
    }
    const category = createCategory(db, parsed.data);
    return apiSuccess({ category }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
