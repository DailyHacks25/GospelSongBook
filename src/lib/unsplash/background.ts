/**
 * Song background resolution: pick a safe Unsplash image for a song's theme
 * (once per song, persisted on the song row) or fall back to the built-in
 * gradient.
 */

import type { Db } from "@/lib/db/index";
import { getSongById, updateSongBackgroundImage } from "@/lib/db/queries/songs";
import type { BackgroundImage, Song } from "@/lib/types";
import {
  FALLBACK_GRADIENT_CLASS,
  getThemeQueries,
  photoToBackgroundImage,
  selectBestPhoto,
  type BackgroundResolution,
} from "@/lib/unsplash/filter";
import { isUnsplashConfigured, searchPhotos, triggerDownload, type FetchLike } from "@/lib/unsplash/client";

export { FALLBACK_GRADIENT_CLASS };

export interface ResolveBackgroundOptions {
  /** Force a fresh lookup even if the song already has one cached. */
  refresh?: boolean;
  fetchImpl?: FetchLike;
}

/**
 * Resolve the background for a song:
 *   1. Return the persisted image if one is already stored (the common path —
 *      no API call at all, which keeps us far below rate limits).
 *   2. Otherwise search the category's curated light/nature queries, run the
 *      safety filter, store the winner on the song and return it.
 *   3. On any failure or empty result, return the fallback gradient.
 */
export async function resolveSongBackground(
  db: Db,
  songId: string,
  categorySlug: string,
  options: ResolveBackgroundOptions = {},
): Promise<BackgroundResolution> {
  const fallback: BackgroundResolution = { image: null, usedFallback: true };

  const song: Song | null = getSongById(db, songId);
  if (!song) return fallback;

  if (!options.refresh && song.backgroundImage) {
    return { image: song.backgroundImage, usedFallback: false };
  }

  if (!isUnsplashConfigured()) return fallback;

  const queries = getThemeQueries(categorySlug);
  for (const query of queries) {
    try {
      const photos = await searchPhotos(query, {
        perPage: 10,
        orientation: "landscape",
        ...(options.fetchImpl ? { fetchImpl: options.fetchImpl } : {}),
      });
      const best = selectBestPhoto(photos);
      if (best) {
        const image: BackgroundImage = photoToBackgroundImage(best);
        updateSongBackgroundImage(db, songId, image);
        // Per Unsplash API guidelines, trigger the download event.
        void triggerDownload(best);
        return { image, usedFallback: false };
      }
    } catch {
      // Try the next query; if all fail we fall back gracefully.
    }
  }

  return fallback;
}

export type { BackgroundResolution };
