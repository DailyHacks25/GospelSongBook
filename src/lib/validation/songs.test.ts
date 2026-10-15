import { describe, expect, it } from "vitest";
import {
  createSongSchema,
  listSongsQuerySchema,
  reviewSongSchema,
  updateSongSchema,
} from "@/lib/validation/songs";
import { createCategorySchema, updateCategorySchema } from "@/lib/validation/categories";
import { fieldErrors, stripControlChars, LYRICS_MAX, TITLE_MAX } from "@/lib/validation/common";

const validSong = {
  title: "Amazing Grace",
  language: "en",
  categoryId: "0b0f8f5e-6a2b-4c1d-9e3f-1a2b3c4d5e01",
  lyrics: "Amazing grace, how sweet the sound\nThat saved a wretch like me.",
};

describe("song input validation", () => {
  it("accepts a valid song", () => {
    const result = createSongSchema.safeParse(validSong);
    expect(result.success).toBe(true);
  });

  it("accepts Hindi lyrics and titles", () => {
    const result = createSongSchema.safeParse({
      ...validSong,
      title: "प्रभु की आराधना",
      language: "hi",
      lyrics: "यीशु का नाम महान है\nहम उसकी आराधना करते हैं",
    });
    expect(result.success).toBe(true);
  });

  it("trims titles and lyrics", () => {
    const result = createSongSchema.safeParse({
      ...validSong,
      title: "  Amazing Grace  ",
      lyrics: "  line one  \n  line two  ",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.title).toBe("Amazing Grace");
      expect(result.data.lyrics).toBe("line one  \n  line two");
    }
  });

  it("rejects a missing/empty title", () => {
    for (const title of ["", "   ", undefined]) {
      const result = createSongSchema.safeParse({ ...validSong, title });
      expect(result.success).toBe(false);
    }
  });

  it("rejects titles over the maximum length", () => {
    const result = createSongSchema.safeParse({
      ...validSong,
      title: "x".repeat(TITLE_MAX + 1),
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(fieldErrors(result.error)).toHaveProperty("title");
    }
  });

  it("rejects empty or whitespace-only lyrics", () => {
    for (const lyrics of ["", "   ", "\n\n\t"]) {
      const result = createSongSchema.safeParse({ ...validSong, lyrics });
      expect(result.success).toBe(false);
    }
  });

  it("rejects lyrics over the maximum length", () => {
    const result = createSongSchema.safeParse({
      ...validSong,
      lyrics: "a".repeat(LYRICS_MAX + 1),
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(fieldErrors(result.error)).toHaveProperty("lyrics");
    }
  });

  it("rejects invalid languages", () => {
    for (const language of ["fr", "EN", "", 5]) {
      const result = createSongSchema.safeParse({ ...validSong, language });
      expect(result.success).toBe(false);
    }
  });

  it("rejects non-UUID category ids", () => {
    const result = createSongSchema.safeParse({ ...validSong, categoryId: "cat-worship" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(fieldErrors(result.error)).toHaveProperty("categoryId");
    }
  });

  it("strips control characters from titles but keeps newlines in lyrics", () => {
    expect(stripControlChars("Hel\u0000lo\u0007")).toBe("Hello");
    expect(stripControlChars("a\nb", { allowNewlines: true })).toBe("a\nb");
    expect(stripControlChars("a\nb")).toBe("ab"); // \n is control unless explicitly allowed
  });

  it("requires at least one field in an update", () => {
    expect(updateSongSchema.safeParse({}).success).toBe(false);
    expect(updateSongSchema.safeParse({ title: "New title" }).success).toBe(true);
    expect(updateSongSchema.safeParse({ status: "pending" }).success).toBe(true);
  });

  it("validates review actions and optional notes", () => {
    expect(reviewSongSchema.safeParse({ action: "approve" }).success).toBe(true);
    expect(reviewSongSchema.safeParse({ action: "reject", note: "Not a gospel song." }).success).toBe(true);
    expect(reviewSongSchema.safeParse({ action: "maybe" }).success).toBe(false);
    expect(
      reviewSongSchema.safeParse({ action: "approve", note: "x".repeat(501) }).success,
    ).toBe(false);
  });

  it("validates list query parameters with safe defaults", () => {
    const result = listSongsQuerySchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.limit).toBe(24);
      expect(result.data.offset).toBe(0);
      expect(result.data.mine).toBe(false);
    }
    expect(listSongsQuerySchema.safeParse({ language: "hi", mine: "1" }).success).toBe(true);
    expect(listSongsQuerySchema.safeParse({ language: "de" }).success).toBe(false);
    expect(listSongsQuerySchema.safeParse({ limit: "500" }).success).toBe(false);
    expect(listSongsQuerySchema.safeParse({ q: "x".repeat(101) }).success).toBe(false);
  });
});

describe("category input validation", () => {
  const validCategory = {
    slug: "worship",
    nameEn: "Worship",
    nameHi: "आराधना",
    sortOrder: 10,
  };

  it("accepts a valid category", () => {
    expect(createCategorySchema.safeParse(validCategory).success).toBe(true);
  });

  it("normalises slugs to kebab-case lowercase", () => {
    const result = createCategorySchema.safeParse({ ...validCategory, slug: "  Christmas-Songs  " });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.slug).toBe("christmas-songs");
  });

  it("rejects malformed slugs", () => {
    for (const slug of ["", "a", "Hello World", "under_score", "-leading", "trailing-", "x".repeat(41)]) {
      const result = createCategorySchema.safeParse({ ...validCategory, slug });
      expect(result.success).toBe(false);
    }
  });

  it("requires both language names", () => {
    expect(createCategorySchema.safeParse({ ...validCategory, nameEn: "" }).success).toBe(false);
    expect(createCategorySchema.safeParse({ ...validCategory, nameHi: "" }).success).toBe(false);
  });

  it("requires at least one field in a category update", () => {
    expect(updateCategorySchema.safeParse({}).success).toBe(false);
    expect(updateCategorySchema.safeParse({ nameHi: "नया नाम" }).success).toBe(true);
    expect(updateCategorySchema.safeParse({ sortOrder: 5 }).success).toBe(true);
    expect(updateCategorySchema.safeParse({ sortOrder: -1 }).success).toBe(false);
  });
});
