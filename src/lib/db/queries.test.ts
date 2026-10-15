import Database from "better-sqlite3";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { initializeDatabase, type Db } from "@/lib/db/index";
import { SEED_CATEGORIES, DEFAULT_ADMIN_EMAIL, DEFAULT_ADMIN_PASSWORD } from "@/lib/db/schema";
import { seedAdminAccount, seedCategories } from "@/lib/db/seed";
import {
  countSongsInCategory,
  createCategory,
  deleteCategory,
  getCategoryBySlug,
  listCategories,
  updateCategory,
} from "@/lib/db/queries/categories";
import {
  countSongs,
  countSongsByStatus,
  createSong,
  deleteSong,
  getSongWithRelations,
  listSongs,
  updateSongBackgroundImage,
  updateSongFields,
  updateSongStatus,
} from "@/lib/db/queries/songs";
import {
  createUserWithPassword,
  getUserByEmail,
  setUserPassword,
  setUserRole,
  upsertUserWithPassword,
  verifyUserPassword,
} from "@/lib/db/queries/users";

const ORIGINAL_ENV = {
  ADMIN_EMAIL: process.env.ADMIN_EMAIL,
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD,
};

let db: Db;

beforeEach(() => {
  process.env.ADMIN_EMAIL = "admin@example.com";
  process.env.ADMIN_PASSWORD = "admin123";
  db = new Database(":memory:");
  initializeDatabase(db);
});

afterEach(() => {
  db.close();
  for (const [key, value] of Object.entries(ORIGINAL_ENV)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
});

function makeAuthor(email = "author@example.com") {
  return createUserWithPassword(db, {
    email,
    name: "Song Author",
    password: "authorpass1",
    role: "user",
  });
}

function makeSong(overrides: { title?: string; language?: "en" | "hi"; categoryId?: string } = {}) {
  const author = makeAuthor();
  const category = getCategoryBySlug(db, "worship")!;
  return createSong(
    db,
    {
      title: overrides.title ?? "Amazing Grace",
      language: overrides.language ?? "en",
      categoryId: overrides.categoryId ?? category.id,
      lyrics: "Amazing grace, how sweet the sound",
    },
    author.id,
  );
}

describe("database schema and seeding", () => {
  it("creates the schema and seeds all eight categories", () => {
    const categories = listCategories(db);
    expect(categories).toHaveLength(SEED_CATEGORIES.length);
    for (const seed of SEED_CATEGORIES) {
      const found = getCategoryBySlug(db, seed.slug);
      expect(found).not.toBeNull();
      expect(found!.nameEn).toBe(seed.nameEn);
      expect(found!.nameHi).toBe(seed.nameHi);
    }
  });

  it("seeding is idempotent", () => {
    seedCategories(db);
    seedCategories(db);
    expect(listCategories(db)).toHaveLength(SEED_CATEGORIES.length);
  });

  it("creates the default admin account with a working password", () => {
    const admin = getUserByEmail(db, "admin@example.com");
    expect(admin).not.toBeNull();
    expect(admin!.role).toBe("admin");
    expect(verifyUserPassword(db, "admin@example.com", "admin123")).not.toBeNull();
    expect(verifyUserPassword(db, "admin@example.com", "wrong")).toBeNull();
    // Running again does not duplicate or break the password.
    expect(seedAdminAccount(db).created).toBe(false);
    expect(verifyUserPassword(db, "admin@example.com", "admin123")).not.toBeNull();
  });

  it("uses the documented default admin when no env is set", () => {
    delete process.env.ADMIN_EMAIL;
    delete process.env.ADMIN_PASSWORD;
    const fresh = new Database(":memory:") as Db;
    initializeDatabase(fresh);
    const admin = getUserByEmail(fresh, DEFAULT_ADMIN_EMAIL);
    expect(admin?.role).toBe("admin");
    expect(verifyUserPassword(fresh, DEFAULT_ADMIN_EMAIL, DEFAULT_ADMIN_PASSWORD)).not.toBeNull();
    fresh.close();
  });

  it("does not overwrite an existing custom password on re-seed", () => {
    setUserPassword(db, "admin@example.com", "RotatedPass1");
    seedAdminAccount(db);
    expect(verifyUserPassword(db, "admin@example.com", "admin123")).toBeNull();
    expect(verifyUserPassword(db, "admin@example.com", "RotatedPass1")).not.toBeNull();
  });
});

describe("user account queries", () => {
  it("creates accounts and verifies passwords", () => {
    const user = createUserWithPassword(db, {
      email: "Someone@Example.com",
      name: "Someone",
      password: "hunter2hunter2",
      role: "user",
    });
    expect(user.email).toBe("someone@example.com");
    expect(user.role).toBe("user");
    expect(verifyUserPassword(db, "someone@example.com", "hunter2hunter2")).not.toBeNull();
    expect(verifyUserPassword(db, "someone@example.com", "nope")).toBeNull();
    expect(verifyUserPassword(db, "missing@example.com", "hunter2hunter2")).toBeNull();
    // Password hashes are never exposed on the domain object.
    expect(user).not.toHaveProperty("passwordHash");
  });

  it("rejects duplicate emails", () => {
    createUserWithPassword(db, { email: "dup@example.com", password: "password1" });
    expect(() =>
      createUserWithPassword(db, { email: "dup@example.com", password: "password2" }),
    ).toThrow();
  });

  it("rotates passwords", () => {
    createUserWithPassword(db, { email: "rotate@example.com", password: "oldpassword" });
    setUserPassword(db, "rotate@example.com", "newpassword1");
    expect(verifyUserPassword(db, "rotate@example.com", "oldpassword")).toBeNull();
    expect(verifyUserPassword(db, "rotate@example.com", "newpassword1")).not.toBeNull();
  });

  it("upserts accounts (create then update role/password)", () => {
    const first = upsertUserWithPassword(db, {
      email: "up@example.com",
      password: "firstpass1",
      role: "user",
    });
    expect(first.created).toBe(true);
    const second = upsertUserWithPassword(db, {
      email: "up@example.com",
      password: "secondpass",
      role: "admin",
    });
    expect(second.created).toBe(false);
    expect(second.user.role).toBe("admin");
    expect(verifyUserPassword(db, "up@example.com", "firstpass1")).toBeNull();
    expect(verifyUserPassword(db, "up@example.com", "secondpass")).not.toBeNull();
  });

  it("promotes and demotes existing accounts only", () => {
    createUserWithPassword(db, { email: "member@example.com", password: "memberpass1" });
    expect(setUserRole(db, "member@example.com", "admin")!.role).toBe("admin");
    expect(setUserRole(db, "member@example.com", "user")!.role).toBe("user");
    // No account → no silent placeholder.
    expect(setUserRole(db, "ghost@example.com", "admin")).toBeNull();
  });
});

describe("song queries", () => {
  it("creates songs in the pending status", () => {
    const song = makeSong();
    expect(song.status).toBe("pending");
    expect(song.backgroundImage).toBeNull();
  });

  it("loads songs with category and author relations", () => {
    const song = makeSong({ title: "How Great Thou Art" });
    const joined = getSongWithRelations(db, song.id)!;
    expect(joined.title).toBe("How Great Thou Art");
    expect(joined.category.slug).toBe("worship");
    expect(joined.category.nameHi).toBe("आराधना");
    expect(joined.author.name).toBe("Song Author");
  });

  it("applies status transitions with review metadata", () => {
    const song = makeSong();
    const admin = getUserByEmail(db, "admin@example.com")!;
    const approved = updateSongStatus(db, song.id, "approved", {
      reviewedBy: admin.id,
      reviewNote: "Clear gospel message.",
    })!;
    expect(approved.status).toBe("approved");
    expect(approved.reviewedBy).toBe(admin.id);
    expect(approved.reviewNote).toBe("Clear gospel message.");
    expect(approved.reviewedAt).not.toBeNull();

    const backToPending = updateSongStatus(db, song.id, "pending", { clearReview: true })!;
    expect(backToPending.status).toBe("pending");
    expect(backToPending.reviewedBy).toBeNull();
    expect(backToPending.reviewNote).toBeNull();
    expect(backToPending.reviewedAt).toBeNull();
  });

  it("updates song fields", () => {
    const song = makeSong();
    const otherCategory = getCategoryBySlug(db, "easter")!;
    const updated = updateSongFields(db, song.id, {
      title: "Because He Lives",
      language: "hi",
      categoryId: otherCategory.id,
      lyrics: "क्योंकि वह जीवित है",
    })!;
    expect(updated.title).toBe("Because He Lives");
    expect(updated.language).toBe("hi");
    expect(updated.categoryId).toBe(otherCategory.id);
    expect(updated.lyrics).toBe("क्योंकि वह जीवित है");
  });

  it("persists background images as JSON with attribution", () => {
    const song = makeSong();
    const image = {
      photoId: "p1",
      url: "https://images.unsplash.com/p1?regular",
      alt: "sunrise",
      photographer: "Photog",
      photographerUrl: "https://unsplash.com/@photog",
      unsplashUrl: "https://unsplash.com/photos/p1",
      width: 2000,
      height: 1200,
    };
    const updated = updateSongBackgroundImage(db, song.id, image)!;
    expect(updated.backgroundImage).toEqual(image);
  });

  it("filters by status, language, category and search text", () => {
    const author = makeAuthor();
    const worship = getCategoryBySlug(db, "worship")!;
    const easter = getCategoryBySlug(db, "easter")!;
    const s1 = createSong(
      db,
      { title: "Amazing Grace", language: "en", categoryId: worship.id, lyrics: "grace how sweet" },
      author.id,
    );
    createSong(
      db,
      { title: "यीशु जीवित है", language: "hi", categoryId: easter.id, lyrics: "वह जीवित है" },
      author.id,
    );
    updateSongStatus(db, s1.id, "approved");

    expect(listSongs(db, { statuses: ["approved"] })).toHaveLength(1);
    expect(listSongs(db, { statuses: ["pending", "approved"] })).toHaveLength(2);
    expect(listSongs(db, { language: "hi" })).toHaveLength(1);
    expect(listSongs(db, { categorySlug: "easter" })).toHaveLength(1);
    expect(listSongs(db, { search: "Amazing" })).toHaveLength(1);
    expect(listSongs(db, { search: "grace" })).toHaveLength(1);
    expect(listSongs(db, { search: "no-such-text" })).toHaveLength(0);
    expect(countSongs(db, { statuses: ["pending", "approved"] })).toBe(2);
    expect(countSongsByStatus(db)).toEqual({ pending: 1, approved: 1, rejected: 0 });
  });

  it("escapes LIKE wildcards in search", () => {
    const author = makeAuthor();
    const category = getCategoryBySlug(db, "worship")!;
    createSong(
      db,
      { title: "100% Praise", language: "en", categoryId: category.id, lyrics: "praise" },
      author.id,
    );
    createSong(
      db,
      { title: "Praise", language: "en", categoryId: category.id, lyrics: "praise" },
      author.id,
    );
    // A raw % would match both; escaped % must match only the literal title.
    expect(listSongs(db, { search: "100%" })).toHaveLength(1);
    expect(listSongs(db, { search: "% Praise" })).toHaveLength(1);
  });

  it("deletes songs", () => {
    const song = makeSong();
    expect(deleteSong(db, song.id)).toBe(true);
    expect(deleteSong(db, song.id)).toBe(false);
  });

  it("supports pagination", () => {
    const author = makeAuthor();
    const category = getCategoryBySlug(db, "worship")!;
    for (let i = 0; i < 5; i++) {
      createSong(
        db,
        { title: `Song ${i}`, language: "en", categoryId: category.id, lyrics: "lyrics" },
        author.id,
      );
    }
    const page1 = listSongs(db, { limit: 2, offset: 0 });
    const page2 = listSongs(db, { limit: 2, offset: 2 });
    expect(page1).toHaveLength(2);
    expect(page2).toHaveLength(2);
    expect(page1[0].id).not.toBe(page2[0].id);
    expect(countSongs(db)).toBe(5);
  });
});

describe("category queries", () => {
  it("creates, updates and deletes categories", () => {
    const created = createCategory(db, {
      slug: "advent",
      nameEn: "Advent",
      nameHi: "एडवेंट",
      sortOrder: 90,
    });
    expect(created.slug).toBe("advent");

    const updated = updateCategory(db, created.id, { nameHi: "एडवेंट काल" })!;
    expect(updated.nameHi).toBe("एडवेंट काल");
    expect(updated.nameEn).toBe("Advent");

    expect(deleteCategory(db, created.id)).toBe(true);
    expect(getCategoryBySlug(db, "advent")).toBeNull();
  });

  it("refuses to lose category data silently — song counts are tracked", () => {
    makeSong();
    const worship = getCategoryBySlug(db, "worship")!;
    expect(countSongsInCategory(db, worship.id)).toBe(1);
  });
});
