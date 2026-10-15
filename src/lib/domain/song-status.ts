/**
 * Song lifecycle: status values and the legal transitions between them.
 *
 *   pending  → approved | rejected   (admin review)
 *   approved → pending  | rejected   (unpublish / revoke)
 *   rejected → pending  | approved   (resubmit / admin override)
 *
 * A song may never "transition" to the status it already has — an attempt to
 * do so is a no-op error, which keeps review actions idempotent-safe and
 * easy to audit.
 */

import { SONG_STATUSES, type SongStatus } from "@/lib/types";
import { AppError } from "@/lib/errors";

export const ALLOWED_TRANSITIONS: Readonly<Record<SongStatus, readonly SongStatus[]>> = {
  pending: ["approved", "rejected"],
  approved: ["pending", "rejected"],
  rejected: ["pending", "approved"],
};

export function isSongStatus(value: unknown): value is SongStatus {
  return typeof value === "string" && (SONG_STATUSES as readonly string[]).includes(value);
}

export function canTransition(from: SongStatus, to: SongStatus): boolean {
  return from !== to && ALLOWED_TRANSITIONS[from].includes(to);
}

/** Throws an AppError (code `invalid_status_transition`) when the move is illegal. */
export function assertTransition(from: SongStatus, to: SongStatus): void {
  if (!canTransition(from, to)) {
    throw new AppError(
      "invalid_status_transition",
      from === to
        ? `Song is already "${to}".`
        : `Cannot change song status from "${from}" to "${to}".`,
    );
  }
}

export type ReviewAction = "approve" | "reject";

export function isReviewAction(value: unknown): value is ReviewAction {
  return value === "approve" || value === "reject";
}

export function statusForReviewAction(action: ReviewAction): SongStatus {
  return action === "approve" ? "approved" : "rejected";
}

export function isPublished(status: SongStatus): boolean {
  return status === "approved";
}
