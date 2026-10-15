import Link from "next/link";
import { LogIn, Music2, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SongDeleteButton } from "@/components/admin/song-delete-button";
import { StatusBadge } from "@/components/songs/status-badge";
import { getDb } from "@/lib/db/index";
import { listSongs } from "@/lib/db/queries/songs";
import { getPageContext } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

export default async function MySongsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: localeParam } = await params;
  const { locale, dict, user } = await getPageContext(localeParam);

  if (!user) {
    return (
      <div className="container flex flex-col items-center py-16">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>{dict.submit.signInRequired}</CardTitle>
            <CardDescription>{dict.submit.signInRequiredDesc}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild size="lg" className="w-full">
              <Link href={`/${locale}/signin?callbackUrl=/${locale}/my-songs`}>
                <LogIn className="h-4 w-4" aria-hidden="true" />
                {dict.nav.signIn}
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const songs = listSongs(getDb(), { authorId: user.id, limit: 100 });

  return (
    <div className="container flex flex-col gap-8 py-10">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-semibold tracking-tight">{dict.mySongs.title}</h1>
          <p className="max-w-2xl text-muted-foreground">{dict.mySongs.subtitle}</p>
        </div>
        <Button asChild>
          <Link href={`/${locale}/submit`}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            {dict.nav.submit}
          </Link>
        </Button>
      </header>

      {songs.length === 0 ? (
        <Card>
          <CardHeader>
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <Music2 className="h-6 w-6 text-muted-foreground" aria-hidden="true" />
            </span>
            <CardTitle className="pt-2">{dict.mySongs.empty}</CardTitle>
            <CardDescription>{dict.mySongs.emptyHint}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline">
              <Link href={`/${locale}/submit`}>
                <Plus className="h-4 w-4" aria-hidden="true" />
                {dict.home.submitSong}
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-xl border border-border bg-card shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{dict.submit.fieldTitle}</TableHead>
                <TableHead>{dict.songs.language}</TableHead>
                <TableHead>{dict.songs.category}</TableHead>
                <TableHead>{dict.mySongs.status}</TableHead>
                <TableHead>{dict.mySongs.updatedAt}</TableHead>
                <TableHead className="text-right">{dict.mySongs.actions}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {songs.map((song) => (
                <TableRow key={song.id}>
                  <TableCell className="font-medium">
                    <Link
                      href={`/${locale}/songs/${song.id}`}
                      className="hover:text-primary hover:underline"
                    >
                      {song.title}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {song.language === "hi" ? dict.songs.hindi : dict.songs.english}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {locale === "hi" ? song.category.nameHi : song.category.nameEn}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={song.status} dict={dict} />
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(song.updatedAt).toLocaleDateString(
                      locale === "hi" ? "hi-IN" : "en-GB",
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-2">
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/${locale}/songs/${song.id}/edit`}>
                          {dict.songs.edit}
                        </Link>
                      </Button>
                      <SongDeleteButton
                        songId={song.id}
                        songTitle={song.title}
                        dict={dict}
                        redirectAfter={`/${locale}/my-songs`}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
