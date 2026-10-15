/**
 * Role-based access checks. Pure functions — unit-tested without a database.
 *
 * Roles:
 *   admin — manage everything: review submissions, edit/delete any song,
 *           manage categories.
 *   user  — create songs; edit or delete their own songs while those songs
 *           are still `pending` or `rejected` (approved songs are managed
 *           by admins so the public book stays curated).
 */

import type { Role, SongStatus } from "@/lib/types";

/** Minimal song shape needed for ownership checks. */
export interface OwnedSong {
  authorId: string;
  status: SongStatus;
}

export interface Viewer {
  id: string;
  role: Role;
}

export function isAdmin(role: Role | null | undefined): boolean {
  return role === "admin";
}

export function canCreateSong(role: Role | null | undefined): boolean {
  return role === "admin" || role === "user";
}

export function canReviewSongs(role: Role | null | undefined): boolean {
  return isAdmin(role);
}

export function canManageCategories(role: Role | null | undefined): boolean {
  return isAdmin(role);
}

export function canEditSong(role: Role | null | undefined, song: OwnedSong, userId: string): boolean {
  if (isAdmin(role)) return true;
  if (role !== "user") return false;
  if (song.authorId !== userId) return false;
  return song.status === "pending" || song.status === "rejected";
}

export function canDeleteSong(role: Role | null | undefined, song: OwnedSong, userId: string): boolean {
  // Same rule as editing: admins may delete anything, users only their own
  // not-yet-published songs.
  return canEditSong(role, song, userId);
}

/**
 * A song is visible to the public only when approved. Authors always see
 * their own songs; admins see everything.
 */
export function canViewSong(
  viewer: Viewer | null,
  song: { authorId: string; status: SongStatus },
): boolean {
  if (song.status === "approved") return true;
  if (!viewer) return false;
  return viewer.role === "admin" || viewer.id === song.authorId;
}

/** Public song lists only ever include approved songs. */
export function visibleStatusesFor(viewer: Viewer | null): SongStatus[] {
  if (viewer?.role === "admin") return ["pending", "approved", "rejected"];
  return ["approved"];
}

/**
 * Whether a user may change a song's status and to what target. Admins may
 * perform any legal transition; authors may only resubmit their own rejected
 * songs (rejected → pending).
 */
export function canSetSongStatus(
  role: Role | null | undefined,
  song: OwnedSong,
  userId: string,
  target: SongStatus,
): boolean {
  if (isAdmin(role)) return true;
  if (role !== "user") return false;
  return song.authorId === userId && song.status === "rejected" && target === "pending";
}
