import { describe, expect, it } from "vitest";
import {
  ALLOWED_TRANSITIONS,
  assertTransition,
  canTransition,
  isPublished,
  isReviewAction,
  isSongStatus,
  statusForReviewAction,
} from "@/lib/domain/song-status";
import { SONG_STATUSES, type SongStatus } from "@/lib/types";
import { AppError } from "@/lib/errors";

describe("song status transitions", () => {
  it("accepts every declared transition", () => {
    expect(canTransition("pending", "approved")).toBe(true);
    expect(canTransition("pending", "rejected")).toBe(true);
    expect(canTransition("approved", "pending")).toBe(true);
    expect(canTransition("approved", "rejected")).toBe(true);
    expect(canTransition("rejected", "pending")).toBe(true);
    expect(canTransition("rejected", "approved")).toBe(true);
  });

  it("rejects same-status transitions", () => {
    for (const status of SONG_STATUSES) {
      expect(canTransition(status, status)).toBe(false);
    }
  });

  it("covers all statuses in the transition map", () => {
    for (const status of SONG_STATUSES) {
      expect(ALLOWED_TRANSITIONS[status]).toBeDefined();
      expect(ALLOWED_TRANSITIONS[status].length).toBe(2);
      for (const target of ALLOWED_TRANSITIONS[status]) {
        expect(SONG_STATUSES).toContain(target);
        expect(target).not.toBe(status);
      }
    }
  });

  it("assertTransition throws a typed AppError for illegal moves", () => {
    expect(() => assertTransition("pending", "approved")).not.toThrow();
    try {
      assertTransition("pending", "pending");
      expect.unreachable("should have thrown");
    } catch (error) {
      expect(error).toBeInstanceOf(AppError);
      expect((error as AppError).code).toBe("invalid_status_transition");
      expect((error as AppError).status).toBe(422);
    }
    try {
      assertTransition("approved", "approved");
      expect.unreachable("should have thrown");
    } catch (error) {
      expect((error as AppError).message).toMatch(/already/i);
    }
  });

  it("maps review actions to statuses", () => {
    expect(statusForReviewAction("approve")).toBe("approved");
    expect(statusForReviewAction("reject")).toBe("rejected");
  });

  it("recognises review actions and statuses", () => {
    expect(isReviewAction("approve")).toBe(true);
    expect(isReviewAction("reject")).toBe(true);
    expect(isReviewAction("maybe")).toBe(false);
    expect(isReviewAction(null)).toBe(false);
    for (const value of SONG_STATUSES) {
      expect(isSongStatus(value)).toBe(true);
    }
    expect(isSongStatus("draft")).toBe(false);
  });

  it("treats only approved songs as published", () => {
    expect(isPublished("approved")).toBe(true);
    expect(isPublished("pending")).toBe(false);
    expect(isPublished("rejected")).toBe(false);
  });

  it("keeps the whole state machine strongly connected", () => {
    // Every status must be reachable from every other (possibly in 2 hops),
    // so admins can always correct mistakes.
    const all: SongStatus[] = [...SONG_STATUSES];
    for (const from of all) {
      for (const to of all) {
        if (from === to) continue;
        const reachable =
          canTransition(from, to) ||
          all.some((mid) => mid !== from && mid !== to && canTransition(from, mid) && canTransition(mid, to));
        expect(reachable).toBe(true);
      }
    }
  });
});
