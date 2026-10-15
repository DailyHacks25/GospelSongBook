/**
 * Category input validation schemas.
 */

import { z } from "zod";
import { stripControlChars } from "@/lib/validation/common";

const slugSchema = z
  .string({ required_error: "Slug is required." })
  .transform((v) => stripControlChars(v).trim().toLowerCase())
  .pipe(
    z
      .string()
      .min(2, "Slug must be at least 2 characters.")
      .max(40, "Slug must be at most 40 characters.")
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug may contain lowercase letters, numbers and hyphens."),
  );

function nameSchema(field: string) {
  return z
    .string({ required_error: `${field} is required.` })
    .transform((v) => stripControlChars(v).trim())
    .pipe(
      z
        .string()
        .min(1, `${field} is required.`)
        .max(60, `${field} must be at most 60 characters.`),
    );
}

export const createCategorySchema = z.object({
  slug: slugSchema,
  nameEn: nameSchema("English name"),
  nameHi: nameSchema("Hindi name"),
  sortOrder: z.coerce
    .number({ invalid_type_error: "Sort order must be a number." })
    .int("Sort order must be a whole number.")
    .min(0, "Sort order must be 0 or greater.")
    .max(10_000, "Sort order must be at most 10000.")
    .optional()
    .default(0),
});
export type CreateCategoryInput = z.infer<typeof createCategorySchema>;

export const updateCategorySchema = z
  .object({
    slug: slugSchema.optional(),
    nameEn: nameSchema("English name").optional(),
    nameHi: nameSchema("Hindi name").optional(),
    sortOrder: z.coerce
      .number({ invalid_type_error: "Sort order must be a number." })
      .int("Sort order must be a whole number.")
      .min(0, "Sort order must be 0 or greater.")
      .max(10_000, "Sort order must be at most 10000.")
      .optional(),
  })
  .refine(
    (v) =>
      v.slug !== undefined ||
      v.nameEn !== undefined ||
      v.nameHi !== undefined ||
      v.sortOrder !== undefined,
    { message: "Provide at least one field to update." },
  );
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
