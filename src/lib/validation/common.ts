/**
 * Shared validation primitives. Every user-supplied value passes through a
 * zod schema at the API boundary before it touches the database.
 */

import { z } from "zod";
import { LANGUAGES, SONG_STATUSES, CATEGORY_SLUGS } from "@/lib/types";

/** Strip C0/C1 control characters that could corrupt rendering or logs. */
export function stripControlChars(value: string, options?: { allowNewlines?: boolean }): string {
  const pattern = options?.allowNewlines ? /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g : /[\u0000-\u001F\u007F-\u009F]/g;
  return value.replace(pattern, "");
}

export const TITLE_MIN = 1;
export const TITLE_MAX = 120;
export const LYRICS_MIN = 1;
export const LYRICS_MAX = 20_000;
export const SEARCH_QUERY_MAX = 100;
export const REVIEW_NOTE_MAX = 500;

export const idSchema = z
  .string()
  .trim()
  .uuid("Invalid identifier.");

export const languageSchema = z.enum(LANGUAGES, {
  errorMap: () => ({ message: "Language must be English (en) or Hindi (hi)." }),
});

export const songStatusSchema = z.enum(SONG_STATUSES, {
  errorMap: () => ({ message: "Status must be pending, approved or rejected." }),
});

export const categorySlugSchema = z.enum(CATEGORY_SLUGS, {
  errorMap: () => ({ message: "Unknown song category." }),
});

export const titleSchema = z
  .string({ required_error: "Title is required." })
  .transform((v) => stripControlChars(v).trim())
  .pipe(
    z
      .string()
      .min(TITLE_MIN, "Title is required.")
      .max(TITLE_MAX, `Title must be at most ${TITLE_MAX} characters.`),
  );

export const lyricsSchema = z
  .string({ required_error: "Lyrics are required." })
  .transform((v) => stripControlChars(v, { allowNewlines: true }).trim())
  .pipe(
    z
      .string()
      .min(LYRICS_MIN, "Lyrics are required.")
      .max(LYRICS_MAX, `Lyrics must be at most ${LYRICS_MAX.toLocaleString()} characters.`),
  )
  .refine((v) => /\S/.test(v), { message: "Lyrics must contain text." });

export const searchQuerySchema = z
  .string()
  .transform((v) => stripControlChars(v).trim())
  .pipe(z.string().max(SEARCH_QUERY_MAX, `Search query must be at most ${SEARCH_QUERY_MAX} characters.`));

export const reviewNoteSchema = z
  .string()
  .transform((v) => stripControlChars(v, { allowNewlines: true }).trim())
  .pipe(z.string().max(REVIEW_NOTE_MAX, `Review note must be at most ${REVIEW_NOTE_MAX} characters.`))
  .optional();

/** Flatten a ZodError into { field: message } for the UI. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const flattened = error.flatten();
  const out: Record<string, string> = {};
  for (const [key, messages] of Object.entries(flattened.fieldErrors)) {
    if (messages && messages.length > 0) out[key] = messages[0];
  }
  if (Object.keys(out).length === 0 && flattened.formErrors.length > 0) {
    out._form = flattened.formErrors[0];
  }
  return out;
}
