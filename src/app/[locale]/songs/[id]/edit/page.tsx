import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SongForm } from "@/components/songs/song-form";
import { canEditSong } from "@/lib/auth/permissions";
import { getDb } from "@/lib/db/index";
import { listCategories } from "@/lib/db/queries/categories";
import { getSongById } from "@/lib/db/queries/songs";
import { getPageContext } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

export default async function EditSongPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale: localeParam, id } = await params;
  const { locale, dict, user } = await getPageContext(localeParam);
  if (!user) notFound();

  const db = getDb();
  const song = getSongById(db, id);
  if (!song) notFound();

  if (!canEditSong(user.role, song, user.id)) {
    return (
      <div className="container flex flex-col items-center gap-4 py-24 text-center">
        <h1 className="text-2xl font-semibold">{dict.errors.forbidden}</h1>
        <p className="text-muted-foreground">{dict.admin.accessDeniedDesc}</p>
        <Button asChild variant="outline">
          <Link href={`/${locale}/songs/${song.id}`}>
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            {dict.common.back}
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container flex flex-col gap-8 py-10">
      <Button asChild variant="ghost" size="sm" className="w-fit gap-1.5">
        <Link href={`/${locale}/songs/${song.id}`}>
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          {dict.common.back}
        </Link>
      </Button>
      <SongForm
        dict={dict}
        categories={listCategories(db)}
        song={song}
        successRedirect={`/${locale}/songs/${song.id}`}
      />
    </div>
  );
}
