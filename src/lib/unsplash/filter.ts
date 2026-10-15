/**
 * Unsplash image safety filter and theming.
 *
 * Hard requirement: no image may depict the face of Jesus Christ or God the
 * Father (or other holy figures). Unsplash's API has no face/subject
 * recognition, so this module applies a conservative text filter over each
 * photo's description, alt text and tags:
 *
 *   1. Curated search queries only ever ask for light and nature scenes
 *      (sunrise, clouds, light through windows, landscapes). We never search
 *      for religious subjects and never pass song titles into the query.
 *   2. Any photo whose metadata mentions religious figures, religious art,
 *      places of worship, or people is rejected outright. When in doubt the
 *      photo is dropped and the calm fallback gradient is used instead.
 *   3. Remaining photos are ranked towards bright, hopeful, light-filled
 *      scenes.
 *
 * This is a best-effort automated filter; admins should still review
 * backgrounds when curating content.
 */

import type { CategorySlug, Language } from "@/lib/types";
import type { BackgroundImage } from "@/lib/types";
import type { UnsplashPhoto } from "@/lib/unsplash/types";

/**
 * Theme queries per category (and a language-flavoured variant set).
 * All queries are deliberately about light, sky and nature.
 */
const QUERIES_BY_CATEGORY: Record<CategorySlug, readonly string[]> = {
  worship: ["sunrise sky rays of light", "golden light through clouds", "radiant sky sunrise"],
  "prayer-songs": ["light through window quiet room", "soft morning light window", "calm dawn light"],
  easter: ["sunrise garden morning light", "empty garden sunrise", "morning light meadow"],
  "good-friday": ["dark clouds rays of light", "stormy sky light breaking", "dramatic sky dark clouds"],
  "palm-sunday": ["palm leaves sunlight", "sunlit path through trees", "green leaves morning sun"],
  "christmas-songs": ["snowy landscape stars night sky", "winter night stars light", "snow forest light"],
  "bible-passage-songs": ["mountain landscape sunrise", "river valley morning light", "wide landscape light sky"],
  others: ["peaceful nature landscape", "clouds blue sky sunlight", "quiet landscape sunset"],
};

/** Extra generic queries used as a final attempt before falling back. */
const GENERIC_QUERIES: readonly string[] = [
  "sun rays clouds sky",
  "sunrise over hills",
  "light through clouds",
];

export function getThemeQueries(categorySlug: string): string[] {
  const known = (QUERIES_BY_CATEGORY as Record<string, readonly string[]>)[categorySlug];
  return [...(known ?? []), ...GENERIC_QUERIES];
}

/**
 * Forbidden metadata terms. Patterns cover religious figures and art,
 * places of worship and any indication of people (a face may be a face of
 * Christ in religious art; we exclude people entirely).
 */
export const FORBIDDEN_PATTERNS: readonly RegExp[] = [
  // Deities and holy figures
  /\bjesus\b/i,
  /\bchrist\b/i,
  /\bgod\b/i,
  /\bmessiah\b/i,
  /\bsavior\b/i,
  /\bsaviour\b/i,
  /\bdeity\b/i,
  /\bholy spirit\b/i,
  /\bholy trinity\b/i,
  /\btrinity\b/i,
  /\bdivine mercy\b/i,
  /\bsacred heart\b/i,
  /\bholy family\b/i,
  // Crucifixion and the cross
  /\bcrucifix/i,
  /\bcrucifixion\b/i,
  /\bcrucified\b/i,
  /\bcalvary\b/i,
  /\bcross\b/i,
  // Saints, angels, nativity
  /\bmadonna\b/i,
  /\bvirgin mary\b/i,
  /\bmother mary\b/i,
  /\bsaint\b/i,
  /\bangel\b/i,
  /\bcherub\b/i,
  /\bnativity\b/i,
  /\bmanger\b/i,
  /\bapostle\b/i,
  /\bdisciple/i,
  /\bgospel\b/i,
  /\bmosiah\b/i,
  // Religious objects, art and places of worship
  /\bbible\b/i,
  /\bprayer\b/i,
  /\bpraying\b/i,
  /\bworship/i,
  /\bpastor\b/i,
  /\bpriest\b/i,
  /\bmonk\b/i,
  /\bnun\b/i,
  /\bchurch\b/i,
  /\bcathedral\b/i,
  /\bchapel\b/i,
  /\bshrine\b/i,
  /\btemple\b/i,
  /\bmosque\b/i,
  /\bsynagogue\b/i,
  /\bstained[- ]?glass\b/i,
  /\bicon\b/i,
  /\bstatue\b/i,
  /\bsculpture\b/i,
  /\bfigurine\b/i,
  /\bportrait\b/i,
  /\bpainting\b/i,
  /\baltar\b/i,
  /\brosary\b/i,
  /\bhalo\b/i,
  // People of any kind
  /\bman\b/i,
  /\bmen\b/i,
  /\bwoman\b/i,
  /\bwomen\b/i,
  /\bperson\b/i,
  /\bpeople\b/i,
  /\bchild(ren)?\b/i,
  /\bkids?\b/i,
  /\bbaby\b/i,
  /\bgirl\b/i,
  /\bboy\b/i,
  /\bhuman/i,
  /\bface\b/i,
  /\bcrowd\b/i,
  /\bfamil(y|ies)\b/i,
  /\bcouple\b/i,
  /\bbride\b/i,
  /\bgroom\b/i,
  /\bwedding\b/i,
  /\bhands?\b/i,
  /\bhiker\b/i,
  /\bfarmer\b/i,
  /\bworker\b/i,
  /\bsoldier\b/i,
  /\bking\b/i,
  /\bqueen\b/i,
];

/** Terms that make a photo more desirable (light-filled, hopeful, natural). */
export const PREFERRED_PATTERNS: readonly RegExp[] = [
  /\bsunrise/i,
  /\bsunset/i,
  /\bdawn\b/i,
  /\bdusk\b/i,
  /\bsunbeam/i,
  /\brays?\b/i,
  /\bsunlight/i,
  /\bsun\b/i,
  /\bglow/i,
  /\blight\b/i,
  /\blights\b/i,
  /\bsky\b/i,
  /\bskies\b/i,
  /\bcloud/i,
  /\blandscape/i,
  /\bmountain/i,
  /\bhills?\b/i,
  /\bvalley\b/i,
  /\bfield\b/i,
  /\bmeadow\b/i,
  /\bforest\b/i,
  /\btrees?\b/i,
  /\bnature\b/i,
  /\bocean\b/i,
  /\bsea\b/i,
  /\blake\b/i,
  /\briver\b/i,
  /\bwater\b/i,
  /\bstar/i,
  /\brainbow\b/i,
  /\bflowers?\b/i,
  /\bwindow\b/i,
  /\bmorning\b/i,
  /\bquiet\b/i,
  /\bpeace/i,
  /\bcalm\b/i,
  /\bhorizon\b/i,
];

function metadataText(photo: UnsplashPhoto): string {
  const parts: string[] = [];
  if (photo.description) parts.push(photo.description);
  if (photo.alt_description) parts.push(photo.alt_description);
  for (const tag of photo.tags ?? []) {
    if (tag?.title) parts.push(tag.title);
  }
  return parts.join(" \n ");
}

/**
 * Returns false when any forbidden term appears in the photo metadata.
 * Conservative by design: unknown → rejected.
 */
export function isSafePhoto(photo: UnsplashPhoto): boolean {
  const text = metadataText(photo);
  return !FORBIDDEN_PATTERNS.some((pattern) => pattern.test(text));
}

/**
 * Rank a safe photo. Higher is better. Light/nature terms boost the score;
 * landscape orientation and larger images get a small bonus.
 */
export function scorePhoto(photo: UnsplashPhoto): number {
  const text = metadataText(photo);
  let score = 0;
  for (const pattern of PREFERRED_PATTERNS) {
    if (pattern.test(text)) score += 1;
  }
  if (photo.width >= photo.height) score += 2; // prefer landscape
  if (photo.width >= 2000) score += 1;
  return score;
}

/**
 * Filter out unsafe photos and return the best-scoring one, or null.
 */
export function selectBestPhoto(photos: readonly UnsplashPhoto[]): UnsplashPhoto | null {
  const safe = photos.filter(isSafePhoto);
  if (safe.length === 0) return null;
  let best = safe[0];
  let bestScore = scorePhoto(best);
  for (const photo of safe.slice(1)) {
    const score = scorePhoto(photo);
    if (score > bestScore) {
      best = photo;
      bestScore = score;
    }
  }
  return best;
}

/** Map an Unsplash photo to our persisted, attribution-safe record. */
export function photoToBackgroundImage(photo: UnsplashPhoto): BackgroundImage {
  return {
    photoId: photo.id,
    url: photo.urls.regular,
    alt: photo.alt_description || photo.description || "Background image from Unsplash",
    photographer: photo.user.name,
    photographerUrl: photo.user.links.html,
    unsplashUrl: photo.links.html,
    width: photo.width,
    height: photo.height,
  };
}

/**
 * The built-in fallback background used when Unsplash is unconfigured, the
 * API fails, or no photo passes the safety filter. A calm sky-like gradient
 * with light emerging through clouds — pure CSS, no external dependency.
 */
export const FALLBACK_GRADIENT_CLASS =
  "bg-[radial-gradient(120%_120%_at_20%_10%,hsl(43,60%,72%)_0%,hsl(36,32%,45%)_28%,hsl(222,36%,20%)_62%,hsl(222,40%,12%)_100%)]";

export interface BackgroundResolution {
  image: BackgroundImage | null;
  /** True when the CSS fallback should be rendered. */
  usedFallback: boolean;
}

/** Language hint used only for UI copy around backgrounds (queries stay English —
 * Unsplash's corpus is mostly English-tagged). */
export type BackgroundLocale = Language;
