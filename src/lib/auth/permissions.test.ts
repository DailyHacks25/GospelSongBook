import { describe, expect, it } from "vitest";
import {
  canCreateSong,
  canDeleteSong,
  canEditSong,
  canManageCategories,
  canReviewSongs,
  canSetSongStatus,
  canViewSong,
  isAdmin,
  visibleStatusesFor,
} from "@/lib/auth/permissions";

const admin = { id: "admin-1", role: "admin" as const };
const user = { id: "user-1", role: "user" as const };
const other = { id: "user-2", role: "user" as const };

const ownPending = { authorId: "user-1", status: "pending" as const };
const ownRejected = { authorId: "user-1", status: "rejected" as const };
const ownApproved = { authorId: "user-1", status: "approved" as const };
const foreignPending = { authorId: "user-2", status: "pending" as const };

describe("role-based access checks", () => {
  it("recognises admins", () => {
    expect(isAdmin("admin")).toBe(true);
    expect(isAdmin("user")).toBe(false);
    expect(isAdmin(null)).toBe(false);
    expect(isAdmin(undefined)).toBe(false);
  });

  it("lets both roles create songs, but only admins review and manage categories", () => {
    expect(canCreateSong("admin")).toBe(true);
    expect(canCreateSong("user")).toBe(true);
    expect(canCreateSong(null)).toBe(false);

    expect(canReviewSongs("admin")).toBe(true);
    expect(canReviewSongs("user")).toBe(false);
    expect(canReviewSongs(null)).toBe(false);

    expect(canManageCategories("admin")).toBe(true);
    expect(canManageCategories("user")).toBe(false);
  });

  it("restricts editing to admins and owners of unpublished songs", () => {
    // Admin: anything.
    expect(canEditSong("admin", ownPending, admin.id)).toBe(true);
    expect(canEditSong("admin", foreignPending, admin.id)).toBe(true);
    expect(canEditSong("admin", ownApproved, admin.id)).toBe(true);

    // Owner: pending and rejected only.
    expect(canEditSong("user", ownPending, user.id)).toBe(true);
    expect(canEditSong("user", ownRejected, user.id)).toBe(true);
    expect(canEditSong("user", ownApproved, user.id)).toBe(false);

    // Not the owner.
    expect(canEditSong("user", foreignPending, user.id)).toBe(false);
    expect(canEditSong("user", ownPending, other.id)).toBe(false);

    // Anonymous/invalid roles.
    expect(canEditSong(null, ownPending, user.id)).toBe(false);
  });

  it("uses the same rule for deletion", () => {
    expect(canDeleteSong("admin", foreignPending, admin.id)).toBe(true);
    expect(canDeleteSong("user", ownRejected, user.id)).toBe(true);
    expect(canDeleteSong("user", ownApproved, user.id)).toBe(false);
    expect(canDeleteSong("user", foreignPending, user.id)).toBe(false);
  });

  it("hides unapproved songs from the public and non-owners", () => {
    expect(canViewSong(null, ownApproved)).toBe(true);
    expect(canViewSong(null, ownPending)).toBe(false);
    expect(canViewSong(other, ownPending)).toBe(false);
    expect(canViewSong(user, ownPending)).toBe(true);
    expect(canViewSong(user, ownRejected)).toBe(true);
    expect(canViewSong(admin, foreignPending)).toBe(true);
    expect(canViewSong(admin, ownApproved)).toBe(true);
  });

  it("limits public lists to approved songs", () => {
    expect(visibleStatusesFor(null)).toEqual(["approved"]);
    expect(visibleStatusesFor(user)).toEqual(["approved"]);
    expect(visibleStatusesFor(admin).sort()).toEqual(["approved", "pending", "rejected"]);
  });

  it("only lets authors resubmit their own rejected songs", () => {
    // Admin may drive any transition.
    expect(canSetSongStatus("admin", ownApproved, admin.id, "pending")).toBe(true);
    expect(canSetSongStatus("admin", ownPending, admin.id, "rejected")).toBe(true);

    // Author: rejected → pending only.
    expect(canSetSongStatus("user", ownRejected, user.id, "pending")).toBe(true);
    expect(canSetSongStatus("user", ownRejected, user.id, "approved")).toBe(false);
    expect(canSetSongStatus("user", ownPending, user.id, "approved")).toBe(false);
    expect(canSetSongStatus("user", ownApproved, user.id, "pending")).toBe(false);
    expect(canSetSongStatus("user", foreignPending, user.id, "pending")).toBe(false);
    expect(canSetSongStatus(null, ownRejected, user.id, "pending")).toBe(false);
  });
});
