import type { NextRequest } from "next/server";
import {
  apiError,
  apiSuccess,
  assertSameOrigin,
  getSessionUser,
  readJsonBody,
  requireUser,
} from "@/lib/auth/guards";
import { getDb } from "@/lib/db/index";
import { getCategoryById } from "@/lib/db/queries/categories";
import { countSongs, createSong, listSongs } from "@/lib/db/queries/songs";
import { AppError } from "@/lib/errors";
import { canCreateSong, visibleStatusesFor } from "@/lib/auth/permissions";
import { createSongSchema, listSongsQuerySchema } from "@/lib/validation/songs";
import { fieldErrors } from "@/lib/validation/common";
import type { SongStatus } from "@/lib/types";

export const runtime = "nodejs";

/** GET /api/songs — list songs visible to the caller. */
export async function GET(request: NextRequest) {
  try {
    const params = Object.fromEntries(request.nextUrl.searchParams.entries());
    const parsed = listSongsQuerySchema.safeParse(params);
    if (!parsed.success) {
      throw new AppError("validation_error", "Invalid query parameters.", {
        fields: fieldErrors(parsed.error),
      });
    }
    const query = parsed.data;
    const viewer = await getSessionUser();
    const db = getDb();

    if (query.mine && viewer) {
      // Own songs: the caller sees everything they own.
      const own = listSongs(db, {
        authorId: viewer.id,
        ...(query.language ? { language: query.language } : {}),
        ...(query.category ? { categorySlug: query.category } : {}),
        ...(query.q ? { search: query.q } : {}),
        limit: query.limit,
        offset: query.offset,
      });
      return apiSuccess({ songs: own, total: own.length });
    }

    const statuses: SongStatus[] =
      query.status && viewer?.role === "admin" ? [query.status] : visibleStatusesFor(viewer);

    const songs = listSongs(db, {
      statuses,
      ...(query.language ? { language: query.language } : {}),
      ...(query.category ? { categorySlug: query.category } : {}),
      ...(query.q ? { search: query.q } : {}),
      limit: query.limit,
      offset: query.offset,
    });
    const total = countSongs(db, {
      statuses,
      ...(query.language ? { language: query.language } : {}),
      ...(query.category ? { categorySlug: query.category } : {}),
      ...(query.q ? { search: query.q } : {}),
    });
    return apiSuccess({ songs, total });
  } catch (error) {
    return apiError(error);
  }
}

/** POST /api/songs — submit a new song (always starts as `pending`). */
export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    const user = await requireUser();
    if (!canCreateSong(user.role)) {
      throw new AppError("forbidden", "You cannot create songs.");
    }
    const body = await readJsonBody(request);
    const parsed = createSongSchema.safeParse(body);
    if (!parsed.success) {
      throw new AppError("validation_error", "Please check the highlighted fields.", {
        fields: fieldErrors(parsed.error),
      });
    }
    const db = getDb();
    const category = getCategoryById(db, parsed.data.categoryId);
    if (!category) {
      throw new AppError("validation_error", "Unknown song category.", {
        fields: { categoryId: "Unknown song category." },
      });
    }
    const song = createSong(db, parsed.data, user.id);
    return apiSuccess({ song }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
