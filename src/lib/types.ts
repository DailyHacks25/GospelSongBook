/**
 * Shared domain types for WorshipJesusChrist.
 */

export const LANGUAGES = ["en", "hi"] as const;
export type Language = (typeof LANGUAGES)[number];

export const SONG_STATUSES = ["pending", "approved", "rejected"] as const;
export type SongStatus = (typeof SONG_STATUSES)[number];

export const ROLES = ["admin", "user"] as const;
export type Role = (typeof ROLES)[number];

/** Category slugs — stable identifiers used in URLs, seeds and the Unsplash theme map. */
export const CATEGORY_SLUGS = [
  "worship",
  "prayer-songs",
  "easter",
  "good-friday",
  "palm-sunday",
  "christmas-songs",
  "bible-passage-songs",
  "others",
] as const;
export type CategorySlug = (typeof CATEGORY_SLUGS)[number];

export interface User {
  id: string;
  googleId: string;
  email: string;
  name: string;
  image: string | null;
  role: Role;
  createdAt: string;
  updatedAt: string;
}

/** The subset of user data we attach to sessions and API auth guards. */
export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: Role;
}

export interface Category {
  id: string;
  slug: string;
  nameEn: string;
  nameHi: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Attribution-safe record of an Unsplash photo used as a song background.
 * Persisted as JSON in `songs.background_image`.
 */
export interface BackgroundImage {
  photoId: string;
  /** Hotlinked image URL served from images.unsplash.com (per Unsplash API guidelines). */
  url: string;
  alt: string;
  photographer: string;
  photographerUrl: string;
  /** Link to the photo page on Unsplash. */
  unsplashUrl: string;
  width: number;
  height: number;
}

export interface Song {
  id: string;
  title: string;
  language: Language;
  categoryId: string;
  lyrics: string;
  status: SongStatus;
  authorId: string;
  backgroundImage: BackgroundImage | null;
  reviewNote: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Song joined with the data the UI needs to render lists and detail pages. */
export interface SongWithRelations extends Song {
  category: Category;
  author: Pick<User, "id" | "name">;
}

/** Locale identifiers used by the UI layer. */
export type Locale = Language;
