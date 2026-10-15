import { afterEach, describe, expect, it, vi } from "vitest";
import { TtlCache } from "@/lib/unsplash/cache";
import {
  clearUnsplashCache,
  isUnsplashConfigured,
  searchPhotos,
  type FetchLike,
} from "@/lib/unsplash/client";
import { UnsplashError, type UnsplashPhoto } from "@/lib/unsplash/types";

const photo: UnsplashPhoto = {
  id: "p1",
  width: 2000,
  height: 1200,
  description: null,
  alt_description: "sunrise",
  urls: {
    raw: "https://images.unsplash.com/p1",
    full: "https://images.unsplash.com/p1?full",
    regular: "https://images.unsplash.com/p1?regular",
    small: "https://images.unsplash.com/p1?small",
    thumb: "https://images.unsplash.com/p1?thumb",
  },
  links: { html: "https://unsplash.com/photos/p1" },
  user: { username: "u", name: "U", links: { html: "https://unsplash.com/@u" } },
};

function jsonResponse(body: unknown, init?: ResponseInit): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
    ...init,
  });
}

const originalKey = process.env.UNSPLASH_ACCESS_KEY;

afterEach(() => {
  if (originalKey === undefined) delete process.env.UNSPLASH_ACCESS_KEY;
  else process.env.UNSPLASH_ACCESS_KEY = originalKey;
  clearUnsplashCache();
  vi.restoreAllMocks();
});

describe("Unsplash client", () => {
  it("reports configuration state", () => {
    delete process.env.UNSPLASH_ACCESS_KEY;
    expect(isUnsplashConfigured()).toBe(false);
    process.env.UNSPLASH_ACCESS_KEY = "abc";
    expect(isUnsplashConfigured()).toBe(true);
    process.env.UNSPLASH_ACCESS_KEY = "   ";
    expect(isUnsplashConfigured()).toBe(false);
  });

  it("throws a missing_key error when unconfigured", async () => {
    delete process.env.UNSPLASH_ACCESS_KEY;
    await expect(searchPhotos("sky")).rejects.toMatchObject({ code: "missing_key" });
  });

  it("calls the search endpoint with the access key and API version", async () => {
    process.env.UNSPLASH_ACCESS_KEY = "test-key";
    const fetchImpl = vi.fn(async () => jsonResponse({ total: 1, results: [photo] })) as unknown as FetchLike;
    const cache = new TtlCache<UnsplashPhoto[]>({ ttlMs: 10_000 });

    const results = await searchPhotos("sunrise sky", { fetchImpl, cache });
    expect(results).toHaveLength(1);

    const [url, init] = (fetchImpl as unknown as ReturnType<typeof vi.fn>).mock.calls[0] as [
      string,
      RequestInit,
    ];
    expect(url).toContain("https://api.unsplash.com/search/photos?");
    expect(url).toContain("query=sunrise+sky");
    expect(url).toContain("content_filter=high");
    expect((init.headers as Record<string, string>).Authorization).toBe("Client-ID test-key");
    expect((init.headers as Record<string, string>)["Accept-Version"]).toBe("v1");
  });

  it("caches search results to respect rate limits", async () => {
    process.env.UNSPLASH_ACCESS_KEY = "test-key";
    const fetchImpl = vi.fn(async () => jsonResponse({ total: 1, results: [photo] })) as unknown as FetchLike;
    const cache = new TtlCache<UnsplashPhoto[]>({ ttlMs: 10_000 });

    await searchPhotos("clouds", { fetchImpl, cache });
    await searchPhotos("clouds", { fetchImpl, cache });
    await searchPhotos("clouds", { fetchImpl, cache });
    expect((fetchImpl as unknown as ReturnType<typeof vi.fn>).mock.calls.length).toBe(1);

    // A different query is fetched separately.
    await searchPhotos("sunrise", { fetchImpl, cache });
    expect((fetchImpl as unknown as ReturnType<typeof vi.fn>).mock.calls.length).toBe(2);
  });

  it("re-fetches after the cache entry expires", async () => {
    process.env.UNSPLASH_ACCESS_KEY = "test-key";
    let now = 0;
    const fetchImpl = vi.fn(async () => jsonResponse({ total: 1, results: [photo] })) as unknown as FetchLike;
    const cache = new TtlCache<UnsplashPhoto[]>({ ttlMs: 100, now: () => now });

    await searchPhotos("dawn", { fetchImpl, cache });
    now = 50;
    await searchPhotos("dawn", { fetchImpl, cache });
    expect((fetchImpl as unknown as ReturnType<typeof vi.fn>).mock.calls.length).toBe(1);
    now = 150;
    await searchPhotos("dawn", { fetchImpl, cache });
    expect((fetchImpl as unknown as ReturnType<typeof vi.fn>).mock.calls.length).toBe(2);
  });

  it("maps 403/429 to rate_limited errors", async () => {
    process.env.UNSPLASH_ACCESS_KEY = "test-key";
    for (const status of [403, 429]) {
      const fetchImpl = (async () =>
        jsonResponse({}, { status })) as unknown as FetchLike;
      await expect(searchPhotos("sky", { fetchImpl })).rejects.toMatchObject({
        code: "rate_limited",
      });
    }
  });

  it("maps other failures to typed errors", async () => {
    process.env.UNSPLASH_ACCESS_KEY = "test-key";
    const serverError = (async () =>
      jsonResponse({}, { status: 500 })) as unknown as FetchLike;
    await expect(searchPhotos("sky", { fetchImpl: serverError })).rejects.toMatchObject({
      code: "http_error",
    });

    const badJson = (async () =>
      new Response("not-json", { status: 200 })) as unknown as FetchLike;
    await expect(searchPhotos("sky", { fetchImpl: badJson })).rejects.toMatchObject({
      code: "invalid_response",
    });

    const wrongShape = (async () =>
      jsonResponse({ unexpected: true })) as unknown as FetchLike;
    await expect(searchPhotos("sky", { fetchImpl: wrongShape })).rejects.toMatchObject({
      code: "invalid_response",
    });

    const networkError = (async () => {
      throw new Error("ECONNREFUSED");
    }) as unknown as FetchLike;
    await expect(searchPhotos("sky", { fetchImpl: networkError })).rejects.toMatchObject({
      code: "network_error",
    });
  });

  it("rejects empty queries", async () => {
    process.env.UNSPLASH_ACCESS_KEY = "test-key";
    await expect(searchPhotos("   ")).rejects.toMatchObject({ code: "invalid_response" });
  });

  it("wraps failures in UnsplashError", async () => {
    process.env.UNSPLASH_ACCESS_KEY = "test-key";
    const fetchImpl = (async () => jsonResponse({}, { status: 500 })) as unknown as FetchLike;
    const error = await searchPhotos("sky", { fetchImpl }).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(UnsplashError);
  });
});
