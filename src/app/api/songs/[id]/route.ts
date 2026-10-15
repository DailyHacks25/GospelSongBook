import type { NextRequest } from "next/server";
import {
  apiError,
  apiSuccess,
  assertSameOrigin,
  getSessionUser,
  readJsonBody,
  requireUser,
} from "@/lib/auth/guards";
import {
  canDeleteSong,
  canEditSong,
  canSetSongStatus,
  canViewSong,
} from "@/lib/auth/permissions";
import { getDb } from "@/lib/db/index";
import { getCategoryById } from "@/lib/db/queries/categories";
import {
  deleteSong,
  getSongWithRelations,
  updateSongFields,
  updateSongStatus,
} from "@/lib/db/queries/songs";
import { assertTransition } from "@/lib/domain/song-status";
import { AppError } from "@/lib/errors";
import { updateSongSchema } from "@/lib/validation/songs";
import { fieldErrors } from "@/lib/validation/common";

export const runtime = "nodejs";

interface RouteContext {
  params: Promise<{ id: string }>;
}

function requireSong(id: string) {
  const song = getSongWithRelations(getDb(), id);
  if (!song) throw new AppError("not_found", "Song not found.");
  return song;
}

/** GET /api/songs/:id — one song (visibility rules applied). */
export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const user = await getSessionUser();
    const song = requireSong(id);
    if (!canViewSong(user, song)) {
      throw new AppError(
        user ? "forbidden" : "unauthorized",
        user ? "You cannot view this song." : "Sign in to view this song.",
      );
    }
    return apiSuccess({ song });
  } catch (error) {
    return apiError(error);
  }
}

/** PATCH /api/songs/:id — edit fields and/or request a status change. */
export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    assertSameOrigin(request);
    const user = await requireUser();
    const { id } = await context.params;
    const song = requireSong(id);

    const body = await readJsonBody(request);
    const parsed = updateSongSchema.safeParse(body);
    if (!parsed.success) {
      throw new AppError("validation_error", "Please check the highlighted fields.", {
        fields: fieldErrors(parsed.error),
      });
    }
    const input = parsed.data;
    const db = getDb();

    const wantsFieldUpdate =
      input.title !== undefined ||
      input.language !== undefined ||
      input.categoryId !== undefined ||
      input.lyrics !== undefined;

    if (wantsFieldUpdate && !canEditSong(user.role, song, user.id)) {
      throw new AppError(
        "forbidden",
        "You can only edit your own songs while they are pending or rejected.",
      );
    }

    if (input.categoryId !== undefined && !getCategoryById(db, input.categoryId)) {
      throw new AppError("validation_error", "Unknown song category.", {
        fields: { categoryId: "Unknown song category." },
      });
    }

    if (wantsFieldUpdate) {
      updateSongFields(db, id, input);
    }

    if (input.status !== undefined) {
      assertTransition(song.status, input.status);
      if (!canSetSongStatus(user.role, song, user.id, input.status)) {
        throw new AppError(
          "forbidden",
          "You cannot change this song's status. Authors may resubmit rejected songs; admins manage approvals.",
        );
      }
      // An author resubmit clears the previous review outcome.
      updateSongStatus(db, id, input.status, {
        clearReview: input.status === "pending",
        reviewedBy: user.role === "admin" ? user.id : null,
      });
    }

    return apiSuccess({ song: requireSong(id) });
  } catch (error) {
    return apiError(error);
  }
}

/** DELETE /api/songs/:id — remove a song (owner while pending/rejected, or admin). */
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    assertSameOrigin(request);
    const user = await requireUser();
    const { id } = await context.params;
    const song = requireSong(id);
    if (!canDeleteSong(user.role, song, user.id)) {
      throw new AppError(
        "forbidden",
        "You can only delete your own songs while they are pending or rejected.",
      );
    }
    deleteSong(getDb(), id);
    return apiSuccess({ deleted: true });
  } catch (error) {
    return apiError(error);
  }
}
