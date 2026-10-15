/**
 * Song input validation schemas (create / update / review / listing).
 */

import { z } from "zod";
import {
  idSchema,
  languageSchema,
  lyricsSchema,
  reviewNoteSchema,
  searchQuerySchema,
  songStatusSchema,
  titleSchema,
} from "@/lib/validation/common";

export const createSongSchema = z.object({
  title: titleSchema,
  language: languageSchema,
  categoryId: idSchema,
  lyrics: lyricsSchema,
});
export type CreateSongInput = z.infer<typeof createSongSchema>;

export const updateSongSchema = z
  .object({
    title: titleSchema.optional(),
    language: languageSchema.optional(),
    categoryId: idSchema.optional(),
    lyrics: lyricsSchema.optional(),
    /**
     * Optional explicit status change. Authorization for the requested
     * transition is enforced separately via permissions + song-status rules.
     */
    status: songStatusSchema.optional(),
  })
  .refine(
    (v) =>
      v.title !== undefined ||
      v.language !== undefined ||
      v.categoryId !== undefined ||
      v.lyrics !== undefined ||
      v.status !== undefined,
    { message: "Provide at least one field to update." },
  );
export type UpdateSongInput = z.infer<typeof updateSongSchema>;

export const reviewSongSchema = z.object({
  action: z.enum(["approve", "reject"], {
    errorMap: () => ({ message: "Action must be approve or reject." }),
  }),
  note: reviewNoteSchema,
});
export type ReviewSongInput = z.infer<typeof reviewSongSchema>;

export const listSongsQuerySchema = z.object({
  language: languageSchema.optional(),
  category: searchQuerySchema.optional(),
  q: searchQuerySchema.optional(),
  status: songStatusSchema.optional(),
  mine: z
    .union([z.literal("1"), z.literal("true"), z.literal("0"), z.literal("false")])
    .optional()
    .transform((v) => v === "1" || v === "true"),
  limit: z.coerce.number().int().min(1).max(100).optional().default(24),
  offset: z.coerce.number().int().min(0).max(10_000).optional().default(0),
});
export type ListSongsQuery = z.infer<typeof listSongsQuerySchema>;
