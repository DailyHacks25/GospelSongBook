import Link from "next/link";
import { Music2, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SongCard } from "@/components/songs/song-card";
import { SongSearchForm } from "@/components/songs/song-search-form";
import { getDb } from "@/lib/db/index";
import { listCategories } from "@/lib/db/queries/categories";
import { countSongs, listSongs } from "@/lib/db/queries/songs";
import { getPageContext } from "@/lib/i18n/server";
import { LOCALE_NAMES } from "@/lib/i18n/config";
import { listSongsQuerySchema } from "@/lib/validation/songs";
import type { SongStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Song Book",
};

interface SearchParams {
  q?: string;
  category?: string;
  language?: string;
  page?: string;
}

const PAGE_SIZE = 24;

export default async function SongsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const { locale: localeParam } = await params;
  const { locale, dict, user } = await getPageContext(localeParam);
  const rawParams = await searchParams;
  const db = getDb();
  const categories = listCategories(db);

  // The listSongsQuerySchema keeps URL input validated at the page boundary too.
  const parsedQuery = listSongsQuerySchema.safeParse({
    ...(rawParams.q ? { q: rawParams.q } : {}),
    ...(rawParams.category ? { category: rawParams.category } : {}),
    ...(rawParams.language ? { language: rawParams.language } : {}),
  });
  const q = parsedQuery.success ? (parsedQuery.data.q ?? "") : "";
  const categorySlug = parsedQuery.success ? (parsedQuery.data.category ?? "") : "";
  const language = parsedQuery.success ? parsedQuery.data.language : undefined;

  const rawPage = Number.parseInt(rawParams.page ?? "1", 10);
  const page = Number.isFinite(rawPage) && rawPage >= 1 ? Math.min(rawPage, 200) : 1;
  const offset = (page - 1) * PAGE_SIZE;

  const statuses: SongStatus[] =
    user?.role === "admin" ? ["approved", "pending", "rejected"] : ["approved"];

  const filter = {
    statuses,
    ...(language ? { language } : {}),
    ...(categorySlug ? { categorySlug } : {}),
    ...(q ? { search: q } : {}),
    limit: PAGE_SIZE,
    offset,
  };
  const songs = listSongs(db, filter);
  const total = countSongs(db, filter);
  const hasFilters = Boolean(q || categorySlug || language);

  const selectedCategory = categories.find((c) => c.slug === categorySlug);
  const title = selectedCategory
    ? locale === "hi"
      ? selectedCategory.nameHi
      : selectedCategory.nameEn
    : dict.songs.title;

  return (
    <div className="container flex flex-col gap-8 py-10">
      <header className="flex flex-col gap-3">
        <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
        <p className="max-w-2xl text-muted-foreground">{dict.songs.subtitle}</p>
      </header>

      <SongSearchForm
        dict={dict}
        categories={categories}
        initialQuery={q}
        initialCategory={categorySlug}
        initialLanguage={language ?? ""}
      />

      <div className="flex flex-wrap items-center gap-2">
        {selectedCategory ? (
          <Badge variant="secondary" className="gap-1">
            {locale === "hi" ? selectedCategory.nameHi : selectedCategory.nameEn}
          </Badge>
        ) : null}
        {language ? (
          <Badge variant="secondary" className="gap-1">
            {LOCALE_NAMES[language]}
          </Badge>
        ) : null}
        {q ? (
          <Badge variant="secondary" className="gap-1">
            “{q}”
          </Badge>
        ) : null}
        {hasFilters ? (
          <Button asChild variant="ghost" size="sm" className="gap-1.5">
            <Link href={`/${locale}/songs`}>
              <XCircle className="h-4 w-4" aria-hidden="true" />
              {dict.songs.clearFilters}
            </Link>
          </Button>
        ) : null}
      </div>

      {songs.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-border bg-card/50 px-6 py-16 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <Music2 className="h-6 w-6 text-muted-foreground" aria-hidden="true" />
          </span>
          <div className="flex flex-col gap-1">
            <h2 className="text-lg font-semibold">{dict.songs.noResults}</h2>
            <p className="text-sm text-muted-foreground">{dict.songs.noResultsHint}</p>
          </div>
        </div>
      ) : (
        <>
          <p className="text-sm text-muted-foreground">
            {total.toLocaleString()} {dict.songs.results}
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {songs.map((song) => (
              <SongCard
                key={song.id}
                song={song}
                locale={locale}
                dict={dict}
                showStatus={user?.role === "admin"}
              />
            ))}
          </div>

          {total > offset + songs.length ? (
            <div className="flex items-center justify-center gap-3 pt-2">
              {page > 1 ? (
                <Button asChild variant="outline">
                  <Link
                    href={`/${locale}/songs?${buildPageHref(rawParams, page - 1)}`}
                  >
                    {dict.common.previous}
                  </Link>
                </Button>
              ) : null}
              <span className="text-sm text-muted-foreground">
                {dict.common.page} {page} {dict.common.of} {Math.ceil(total / PAGE_SIZE)}
              </span>
              <Button asChild variant="outline">
                <Link href={`/${locale}/songs?${buildPageHref(rawParams, page + 1)}`}>
                  {dict.common.next}
                </Link>
              </Button>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}

function buildPageHref(params: SearchParams, page: number): string {
  const search = new URLSearchParams();
  if (params.q) search.set("q", params.q);
  if (params.category) search.set("category", params.category);
  if (params.language) search.set("language", params.language);
  search.set("page", String(page));
  return search.toString();
}
