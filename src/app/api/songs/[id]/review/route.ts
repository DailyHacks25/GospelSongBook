import type { NextRequest } from "next/server";
import {
  apiError,
  apiSuccess,
  assertSameOrigin,
  readJsonBody,
  requireAdmin,
} from "@/lib/auth/guards";
import { canReviewSongs } from "@/lib/auth/permissions";
import { getDb } from "@/lib/db/index";
import { getSongWithRelations, updateSongStatus } from "@/lib/db/queries/songs";
import { assertTransition, statusForReviewAction } from "@/lib/domain/song-status";
import { AppError } from "@/lib/errors";
import { reviewSongSchema } from "@/lib/validation/songs";
import { fieldErrors } from "@/lib/validation/common";

export const runtime = "nodejs";

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/songs/:id/review — admin approve/reject.
 * Body: { action: "approve" | "reject", note?: string }
 */
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    assertSameOrigin(request);
    const admin = await requireAdmin();
    if (!canReviewSongs(admin.role)) {
      throw new AppError("forbidden", "Administrator access is required.");
    }
    const { id } = await context.params;
    const db = getDb();
    const song = getSongWithRelations(db, id);
    if (!song) throw new AppError("not_found", "Song not found.");

    const body = await readJsonBody(request);
    const parsed = reviewSongSchema.safeParse(body);
    if (!parsed.success) {
      throw new AppError("validation_error", "Please check the review form.", {
        fields: fieldErrors(parsed.error),
      });
    }

    const nextStatus = statusForReviewAction(parsed.data.action);
    assertTransition(song.status, nextStatus);

    const updated = updateSongStatus(db, id, nextStatus, {
      reviewedBy: admin.id,
      reviewNote: parsed.data.note ?? null,
    });
    return apiSuccess({ song: updated });
  } catch (error) {
    return apiError(error);
  }
}
