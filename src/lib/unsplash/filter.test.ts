import { describe, expect, it } from "vitest";
import {
  FORBIDDEN_PATTERNS,
  PREFERRED_PATTERNS,
  getThemeQueries,
  isSafePhoto,
  photoToBackgroundImage,
  scorePhoto,
  selectBestPhoto,
} from "@/lib/unsplash/filter";
import type { UnsplashPhoto } from "@/lib/unsplash/types";

function makePhoto(overrides: Partial<UnsplashPhoto> = {}): UnsplashPhoto {
  return {
    id: "photo-1",
    width: 2400,
    height: 1600,
    description: null,
    alt_description: "a calm sunrise over the hills",
    urls: {
      raw: "https://images.unsplash.com/photo-1",
      full: "https://images.unsplash.com/photo-1?full",
      regular: "https://images.unsplash.com/photo-1?regular",
      small: "https://images.unsplash.com/photo-1?small",
      thumb: "https://images.unsplash.com/photo-1?thumb",
    },
    links: {
      html: "https://unsplash.com/photos/photo-1",
      download_location: "https://api.unsplash.com/photos/photo-1/download",
    },
    user: {
      username: "photog",
      name: "Photog Person",
      links: { html: "https://unsplash.com/@photog" },
    },
    tags: [],
    ...overrides,
  };
}

describe("Unsplash photo safety filter", () => {
  it("accepts light-filled nature scenes", () => {
    expect(isSafePhoto(makePhoto())).toBe(true);
    expect(isSafePhoto(makePhoto({ alt_description: "golden sunlight through clouds" }))).toBe(true);
    expect(isSafePhoto(makePhoto({ alt_description: "mountain landscape at dawn" }))).toBe(true);
    expect(isSafePhoto(makePhoto({ alt_description: "light through a window" }))).toBe(true);
  });

  it("rejects any photo mentioning Jesus, Christ or God", () => {
    const cases = [
      "Jesus walking on water",
      "statue of jesus christ",
      "God the Father in the clouds",
      "painting of Christ the redeemer",
      "the messiah in the manger",
      "divine mercy image",
      "sacred heart of jesus",
    ];
    for (const alt_description of cases) {
      expect(isSafePhoto(makePhoto({ alt_description }))).toBe(false);
    }
  });

  it("rejects religious art, places of worship and the cross", () => {
    const cases = [
      "a wooden cross on a hill",
      "crucifix on the wall",
      "stained glass window in a church",
      "cathedral interior with light",
      "open bible on a table",
      "hands in prayer",
      "worship congregation",
      "statue of a saint",
      "nativity scene at christmas",
      "angel statue in the garden",
    ];
    for (const alt_description of cases) {
      expect(isSafePhoto(makePhoto({ alt_description }))).toBe(false);
    }
  });

  it("rejects photos of people (a face may be a holy figure)", () => {
    const cases = [
      "a man looking at the sky",
      "woman in a field",
      "portrait of a child",
      "family holding hands",
      "crowd at sunrise",
      "people worshipping",
    ];
    for (const alt_description of cases) {
      expect(isSafePhoto(makePhoto({ alt_description }))).toBe(false);
    }
  });

  it("checks description and tags as well as alt text", () => {
    expect(isSafePhoto(makePhoto({ description: "Jesus in the light" }))).toBe(false);
    expect(
      isSafePhoto(makePhoto({ tags: [{ title: "god" }, { title: "sky" }] })),
    ).toBe(false);
    expect(
      isSafePhoto(makePhoto({ tags: [{ title: "sunrise" }, { title: "clouds" }] })),
    ).toBe(true);
  });

  it("does not reject innocent words that merely contain forbidden substrings", () => {
    // \bgod\b must not match "goddess"? Actually "goddess" has no boundary after god…
    // but "iconic" must not match \bicon\b, "manual" must not match \bman\b.
    expect(isSafePhoto(makePhoto({ alt_description: "iconic sunrise over the meadow" }))).toBe(true);
    expect(isSafePhoto(makePhoto({ alt_description: "a manual typewriter at dawn" }))).toBe(true);
    expect(isSafePhoto(makePhoto({ alt_description: "management of the forest" }))).toBe(true);
    expect(isSafePhoto(makePhoto({ alt_description: "ocean waves at sunrise" }))).toBe(true);
  });

  it("exposes the pattern lists for auditing", () => {
    expect(FORBIDDEN_PATTERNS.length).toBeGreaterThan(30);
    expect(PREFERRED_PATTERNS.length).toBeGreaterThan(15);
  });
});

describe("photo scoring and selection", () => {
  it("prefers light and landscape imagery", () => {
    const plain = makePhoto({ id: "plain", alt_description: "a quiet scene", width: 1000, height: 1000 });
    const bright = makePhoto({ id: "bright", alt_description: "sunrise sun rays over the mountains", width: 3000, height: 2000 });
    expect(scorePhoto(bright)).toBeGreaterThan(scorePhoto(plain));
  });

  it("selectBestPhoto returns the highest-scoring safe photo", () => {
    const photos = [
      makePhoto({ id: "unsafe", alt_description: "jesus portrait" }),
      makePhoto({ id: "plain", alt_description: "a quiet scene", width: 1000, height: 1000 }),
      makePhoto({ id: "bright", alt_description: "golden sunrise rays through clouds", width: 3000, height: 2000 }),
    ];
    expect(selectBestPhoto(photos)?.id).toBe("bright");
  });

  it("returns null when every photo is unsafe", () => {
    const photos = [
      makePhoto({ id: "a", alt_description: "jesus christ" }),
      makePhoto({ id: "b", alt_description: "crowd of people" }),
    ];
    expect(selectBestPhoto(photos)).toBeNull();
    expect(selectBestPhoto([])).toBeNull();
  });
});

describe("background mapping", () => {
  it("maps a photo to an attribution-safe record", () => {
    const image = photoToBackgroundImage(makePhoto());
    expect(image).toEqual({
      photoId: "photo-1",
      url: "https://images.unsplash.com/photo-1?regular",
      alt: "a calm sunrise over the hills",
      photographer: "Photog Person",
      photographerUrl: "https://unsplash.com/@photog",
      unsplashUrl: "https://unsplash.com/photos/photo-1",
      width: 2400,
      height: 1600,
    });
  });

  it("falls back to a generic alt when none is available", () => {
    const image = photoToBackgroundImage(
      makePhoto({ alt_description: null, description: null }),
    );
    expect(image.alt.length).toBeGreaterThan(0);
  });
});

describe("theme queries", () => {
  it("returns curated queries for every category", () => {
    const slugs = [
      "worship",
      "prayer-songs",
      "easter",
      "good-friday",
      "palm-sunday",
      "christmas-songs",
      "bible-passage-songs",
      "others",
    ];
    for (const slug of slugs) {
      const queries = getThemeQueries(slug);
      expect(queries.length).toBeGreaterThanOrEqual(3);
      // Never search for religious figures or song titles.
      for (const query of queries) {
        expect(query.toLowerCase()).not.toMatch(/jesus|christ|god|mary|bible/);
      }
    }
  });

  it("falls back to generic light queries for unknown categories", () => {
    expect(getThemeQueries("unknown-category").length).toBeGreaterThan(0);
  });
});
