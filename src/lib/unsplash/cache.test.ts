import { describe, expect, it } from "vitest";
import { TtlCache } from "@/lib/unsplash/cache";

describe("TtlCache", () => {
  it("stores and returns values", () => {
    const cache = new TtlCache<string>({ ttlMs: 1000 });
    cache.set("a", "alpha");
    expect(cache.get("a")).toBe("alpha");
    expect(cache.has("a")).toBe(true);
    expect(cache.get("missing")).toBeUndefined();
  });

  it("expires entries after the TTL", () => {
    let now = 0;
    const cache = new TtlCache<string>({ ttlMs: 100, now: () => now });
    cache.set("a", "alpha");
    now = 99;
    expect(cache.get("a")).toBe("alpha");
    now = 100;
    expect(cache.get("a")).toBeUndefined();
    expect(cache.has("a")).toBe(false);
  });

  it("refreshes expiry on set", () => {
    let now = 0;
    const cache = new TtlCache<string>({ ttlMs: 100, now: () => now });
    cache.set("a", "one");
    now = 80;
    cache.set("a", "two");
    now = 150;
    expect(cache.get("a")).toBe("two");
    now = 181;
    expect(cache.get("a")).toBeUndefined();
  });

  it("evicts the oldest entries beyond maxEntries (LRU by insertion)", () => {
    const cache = new TtlCache<number>({ ttlMs: 10_000, maxEntries: 2 });
    cache.set("a", 1);
    cache.set("b", 2);
    cache.set("c", 3);
    expect(cache.size).toBe(2);
    expect(cache.get("a")).toBeUndefined();
    expect(cache.get("b")).toBe(2);
    expect(cache.get("c")).toBe(3);
  });

  it("re-inserting a key marks it as recently used", () => {
    const cache = new TtlCache<number>({ ttlMs: 10_000, maxEntries: 2 });
    cache.set("a", 1);
    cache.set("b", 2);
    cache.set("a", 11); // a is now newest
    cache.set("c", 3); // evicts b, not a
    expect(cache.get("a")).toBe(11);
    expect(cache.get("b")).toBeUndefined();
    expect(cache.get("c")).toBe(3);
  });

  it("prunes expired entries", () => {
    let now = 0;
    const cache = new TtlCache<number>({ ttlMs: 50, now: () => now });
    cache.set("a", 1);
    cache.set("b", 2);
    now = 100;
    cache.prune();
    expect(cache.size).toBe(0);
  });

  it("supports delete and clear", () => {
    const cache = new TtlCache<number>({ ttlMs: 1000 });
    cache.set("a", 1);
    cache.set("b", 2);
    expect(cache.delete("a")).toBe(true);
    expect(cache.delete("a")).toBe(false);
    expect(cache.size).toBe(1);
    cache.clear();
    expect(cache.size).toBe(0);
  });

  it("validates constructor options", () => {
    expect(() => new TtlCache({ ttlMs: 0 })).toThrow();
    expect(() => new TtlCache({ ttlMs: -5 })).toThrow();
    expect(() => new TtlCache({ ttlMs: 100, maxEntries: 0 })).toThrow();
  });
});
