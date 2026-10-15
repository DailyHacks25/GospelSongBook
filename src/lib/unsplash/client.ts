/**
 * Minimal Unsplash API client (search + download trigger) with in-memory
 * caching to respect the demo rate limit (50 req/hour per key on the
 * Unsplash demo tier).
 */

import { TtlCache } from "@/lib/unsplash/cache";
import {
  UnsplashError,
  type UnsplashPhoto,
  type UnsplashSearchResponse,
} from "@/lib/unsplash/types";

const UNSPLASH_API_BASE = "https://api.unsplash.com";

export function getUnsplashAccessKey(): string | undefined {
  const key = process.env.UNSPLASH_ACCESS_KEY?.trim();
  return key ? key : undefined;
}

export function isUnsplashConfigured(): boolean {
  return getUnsplashAccessKey() !== undefined;
}

function cacheTtlMs(): number {
  const raw = Number(process.env.UNSPLASH_CACHE_TTL_SECONDS ?? "1800");
  if (!Number.isFinite(raw) || raw <= 0) return 30 * 60 * 1000;
  return raw * 1000;
}

export interface FetchLike {
  (input: string, init?: RequestInit): Promise<Response>;
}

export interface SearchPhotosOptions {
  perPage?: number;
  orientation?: "landscape" | "portrait" | "squarish";
  /** Content filter; we always use "high" (Unsplash's safer tier). */
  fetchImpl?: FetchLike;
  /** Override cache (tests). */
  cache?: TtlCache<UnsplashPhoto[]>;
}

let defaultCache: TtlCache<UnsplashPhoto[]> | null = null;

function getDefaultCache(): TtlCache<UnsplashPhoto[]> {
  if (!defaultCache) {
    defaultCache = new TtlCache<UnsplashPhoto[]>({ ttlMs: cacheTtlMs(), maxEntries: 50 });
  }
  return defaultCache;
}

/** Test hook: forget cached searches. */
export function clearUnsplashCache(): void {
  defaultCache?.clear();
}

/**
 * Search Unsplash photos by query. Results are cached in memory for
 * UNSPLASH_CACHE_TTL_SECONDS (default 30 minutes).
 */
export async function searchPhotos(
  query: string,
  options: SearchPhotosOptions = {},
): Promise<UnsplashPhoto[]> {
  const accessKey = getUnsplashAccessKey();
  if (!accessKey) {
    throw new UnsplashError("missing_key", "UNSPLASH_ACCESS_KEY is not configured.");
  }
  const trimmed = query.trim();
  if (trimmed === "") {
    throw new UnsplashError("invalid_response", "Search query must not be empty.");
  }

  const cache = options.cache ?? getDefaultCache();
  const cacheKey = `${trimmed}|${options.perPage ?? 10}|${options.orientation ?? "landscape"}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  const fetchImpl = options.fetchImpl ?? fetch;
  const params = new URLSearchParams({
    query: trimmed,
    per_page: String(options.perPage ?? 10),
    orientation: options.orientation ?? "landscape",
    content_filter: "high",
    order_by: "relevant",
  });

  let response: Response;
  try {
    response = await fetchImpl(`${UNSPLASH_API_BASE}/search/photos?${params.toString()}`, {
      headers: {
        Authorization: `Client-ID ${accessKey}`,
        "Accept-Version": "v1",
      },
    });
  } catch (cause) {
    throw new UnsplashError("network_error", "Could not reach Unsplash.", { cause });
  }

  if (response.status === 403 || response.status === 429) {
    throw new UnsplashError("rate_limited", "Unsplash rate limit reached. Try again later.");
  }
  if (!response.ok) {
    throw new UnsplashError(
      "http_error",
      `Unsplash request failed with status ${response.status}.`,
    );
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch (cause) {
    throw new UnsplashError("invalid_response", "Unsplash returned invalid JSON.", { cause });
  }

  const results = (payload as UnsplashSearchResponse)?.results;
  if (!Array.isArray(results)) {
    throw new UnsplashError("invalid_response", "Unsplash response is missing results.");
  }

  cache.set(cacheKey, results);
  return results;
}

/**
 * Notify Unsplash that a photo was "downloaded" (used when we permanently
 * adopt a photo as a song background). Per the API guidelines this should be
 * triggered when a photo is downloaded/kept; it is fire-and-forget.
 */
export async function triggerDownload(photo: UnsplashPhoto): Promise<void> {
  const accessKey = getUnsplashAccessKey();
  const location = photo.links?.download_location;
  if (!accessKey || !location) return;
  const fetchImpl = fetch;
  try {
    await fetchImpl(location, {
      headers: {
        Authorization: `Client-ID ${accessKey}`,
        "Accept-Version": "v1",
      },
    });
  } catch {
    // Best effort — never break page rendering over analytics.
  }
}
