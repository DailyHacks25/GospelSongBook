import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Calendar, Languages, Pencil, User as UserIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SongBackground } from "@/components/backgrounds/song-background";
import { SongDeleteButton } from "@/components/admin/song-delete-button";
import { StatusBadge } from "@/components/songs/status-badge";
import { canEditSong, canViewSong } from "@/lib/auth/permissions";
import { getDb } from "@/lib/db/index";
import { getSongWithRelations } from "@/lib/db/queries/songs";
import { getPageContext } from "@/lib/i18n/server";
import { resolveSongBackground } from "@/lib/unsplash/background";

export const dynamic = "force-dynamic";

interface RouteParams {
  locale: string;
  id: string;
}

export default async function SongPage({
  params,
}: {
  params: Promise<RouteParams>;
}) {
  const { locale: localeParam, id } = await params;
  const { locale, dict, user } = await getPageContext(localeParam);
  const db = getDb();
  const song = getSongWithRelations(db, id);
  if (!song) notFound();

  if (!canViewSong(user, song)) {
    // Unpublished songs are hidden from the public — behave like a 404 for
    // anonymous visitors, and explain clearly for signed-in non-owners.
    if (!user) notFound();
    return (
      <div className="container flex flex-col items-center gap-4 py-24 text-center">
        <h1 className="text-2xl font-semibold">{dict.errors.forbidden}</h1>
        <p className="text-muted-foreground">{dict.admin.accessDeniedDesc}</p>
        <Button asChild variant="outline">
          <Link href={`/${locale}/songs`}>
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            {dict.songs.backToSongs}
          </Link>
        </Button>
      </div>
    );
  }

  const { image } = await resolveSongBackground(db, song.id, song.category.slug);
  const categoryName = locale === "hi" ? song.category.nameHi : song.category.nameEn;
  const editable = canEditSong(user?.role ?? null, song, user?.id ?? "");

  return (
    <div className="container flex flex-col gap-8 py-10">
      <Button asChild variant="ghost" size="sm" className="w-fit gap-1.5">
        <Link href={`/${locale}/songs`}>
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          {dict.songs.backToSongs}
        </Link>
      </Button>

      <article>
        <SongBackground
          image={image}
          attributionLabel={dict.songs.backgroundCredit}
          fallbackLabel={dict.songs.backgroundFallback}
        >
          <div className="flex flex-col gap-6 px-6 py-12 sm:px-10 sm:py-16">
            <header className="flex max-w-3xl flex-col gap-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="bg-white/15 text-white ring-1 ring-white/25 hover:bg-white/20">
                  <Languages className="h-3.5 w-3.5" aria-hidden="true" />
                  {song.language === "hi" ? dict.songs.hindi : dict.songs.english}
                </Badge>
                <Badge className="bg-white/15 text-white ring-1 ring-white/25 hover:bg-white/20">
                  {categoryName}
                </Badge>
                {song.status !== "approved" ? <StatusBadge status={song.status} dict={dict} /> : null}
              </div>
              <h1
                className="text-balance text-3xl font-semibold tracking-tight text-white sm:text-4xl"
                lang={song.language}
              >
                {song.title}
              </h1>
              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-white/80">
                <span className="inline-flex items-center gap-1.5">
                  <UserIcon className="h-4 w-4" aria-hidden="true" />
                  {dict.songs.submittedBy} {song.author.name}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" aria-hidden="true" />
                  {new Date(song.createdAt).toLocaleDateString(locale === "hi" ? "hi-IN" : "en-GB", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
              </div>
            </header>

            <Separator className="bg-white/15" />

            <div
              className="lyrics max-w-3xl whitespace-pre-wrap font-medium text-white"
              lang={song.language}
            >
              {song.lyrics}
            </div>
          </div>
        </SongBackground>
      </article>

      {(editable || user?.role === "admin") && (
        <div className="flex flex-wrap items-center gap-3">
          {editable ? (
            <Button asChild variant="outline">
              <Link href={`/${locale}/songs/${song.id}/edit`}>
                <Pencil className="h-4 w-4" aria-hidden="true" />
                {dict.songs.edit}
              </Link>
            </Button>
          ) : null}
          {editable || user?.role === "admin" ? (
            <SongDeleteButton
              songId={song.id}
              songTitle={song.title}
              dict={dict}
              redirectAfter={`/${locale}/songs`}
              size="default"
            />
          ) : null}
        </div>
      )}
    </div>
  );
}
