import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  FolderTree,
  Music2,
  Plus,
  ShieldAlert,
  XCircle,
} from "lucide-react";
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
import { ReviewActions } from "@/components/admin/review-actions";
import { SongDeleteButton } from "@/components/admin/song-delete-button";
import { StatusBadge } from "@/components/songs/status-badge";
import { getDb } from "@/lib/db/index";
import { countSongs, countSongsByStatus, listSongs } from "@/lib/db/queries/songs";
import { getPageContext } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

export default async function AdminPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: localeParam } = await params;
  const { locale, dict, user } = await getPageContext(localeParam);

  if (!user) redirect(`/${locale}/signin?callbackUrl=/${locale}/admin`);
  if (user.role !== "admin") {
    return (
      <div className="container flex flex-col items-center gap-4 py-24 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
          <ShieldAlert className="h-6 w-6 text-destructive" aria-hidden="true" />
        </span>
        <h1 className="text-2xl font-semibold">{dict.admin.accessDenied}</h1>
        <p className="max-w-md text-muted-foreground">{dict.admin.accessDeniedDesc}</p>
        <Button asChild variant="outline">
          <Link href={`/${locale}`}>{dict.nav.home}</Link>
        </Button>
      </div>
    );
  }

  const db = getDb();
  const stats = countSongsByStatus(db);
  const pending = listSongs(db, { statuses: ["pending"], limit: 50 });
  const recent = listSongs(db, {
    statuses: ["approved", "rejected"],
    limit: 15,
  });
  const total = countSongs(db, { statuses: ["approved", "pending", "rejected"] });

  const statCards = [
    { label: dict.admin.totalSongs, value: total, icon: Music2 },
    { label: dict.admin.approvedSongs, value: stats.approved, icon: CheckCircle2 },
    { label: dict.admin.pendingSongs, value: stats.pending, icon: Clock3 },
    { label: dict.admin.rejectedSongs, value: stats.rejected, icon: XCircle },
  ];

  return (
    <div className="container flex flex-col gap-10 py-10">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-semibold tracking-tight">{dict.admin.title}</h1>
          <p className="max-w-2xl text-muted-foreground">{dict.admin.subtitle}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button asChild>
            <Link href={`/${locale}/submit`}>
              <Plus className="h-4 w-4" aria-hidden="true" />
              {dict.admin.addSong}
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href={`/${locale}/admin/categories`}>
              <FolderTree className="h-4 w-4" aria-hidden="true" />
              {dict.admin.manageCategories}
            </Link>
          </Button>
        </div>
      </header>

      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4" aria-label={dict.admin.dashboard}>
        {statCards.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardDescription>{stat.label}</CardDescription>
              <stat.icon className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold tabular-nums">{stat.value.toLocaleString()}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="flex flex-col gap-4" aria-label={dict.admin.pendingReview}>
        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-semibold tracking-tight">{dict.admin.pendingReview}</h2>
          <p className="text-sm text-muted-foreground">{dict.admin.pendingReviewDesc}</p>
        </div>

        {pending.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{dict.admin.noPending}</CardTitle>
              <CardDescription>{dict.admin.noPendingDesc}</CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <div className="flex flex-col gap-4">
            {pending.map((song) => (
              <Card key={song.id}>
                <CardHeader className="pb-3">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex flex-col gap-1.5">
                      <CardTitle className="text-base">
                        <Link
                          href={`/${locale}/songs/${song.id}`}
                          className="hover:text-primary hover:underline"
                        >
                          {song.title}
                        </Link>
                      </CardTitle>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline">
                          {song.language === "hi" ? dict.songs.hindi : dict.songs.english}
                        </Badge>
                        <Badge variant="secondary">
                          {locale === "hi" ? song.category.nameHi : song.category.nameEn}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {dict.songs.submittedBy} {song.author.name} ·{" "}
                          {new Date(song.createdAt).toLocaleDateString(
                            locale === "hi" ? "hi-IN" : "en-GB",
                          )}
                        </span>
                      </div>
                    </div>
                    <StatusBadge status={song.status} dict={dict} />
                  </div>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                  <p className="line-clamp-3 whitespace-pre-wrap rounded-md bg-muted/60 p-3 text-sm text-muted-foreground">
                    {song.lyrics}
                  </p>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <ReviewActions songId={song.id} songTitle={song.title} dict={dict} />
                    <div className="flex items-center gap-2">
                      <Button asChild variant="ghost" size="sm">
                        <Link href={`/${locale}/songs/${song.id}/edit`}>
                          {dict.admin.editSong}
                          <ArrowRight className="h-4 w-4" aria-hidden="true" />
                        </Link>
                      </Button>
                      <SongDeleteButton songId={song.id} songTitle={song.title} dict={dict} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section className="flex flex-col gap-4" aria-label={dict.admin.allSongs}>
        <h2 className="text-xl font-semibold tracking-tight">{dict.admin.allSongs}</h2>
        <div className="rounded-xl border border-border bg-card shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{dict.submit.fieldTitle}</TableHead>
                <TableHead>{dict.songs.language}</TableHead>
                <TableHead>{dict.songs.category}</TableHead>
                <TableHead>{dict.mySongs.status}</TableHead>
                <TableHead className="text-right">{dict.mySongs.actions}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recent.map((song) => (
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
                    {song.language === "hi" ? dict.songs.hindi : dict.songs.english}
                  </TableCell>
                  <TableCell>
                    {locale === "hi" ? song.category.nameHi : song.category.nameEn}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={song.status} dict={dict} />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-2">
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/${locale}/songs/${song.id}/edit`}>
                          {dict.admin.editSong}
                        </Link>
                      </Button>
                      <SongDeleteButton songId={song.id} songTitle={song.title} dict={dict} />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </section>
    </div>
  );
}
