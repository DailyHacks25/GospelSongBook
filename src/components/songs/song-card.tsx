import Link from "next/link";
import { ArrowRight, Music2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/songs/status-badge";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/lib/i18n/config";
import type { SongWithRelations } from "@/lib/types";

export interface SongCardProps {
  song: SongWithRelations;
  locale: Locale;
  dict: Dictionary;
  /** Show the moderation status (My Songs / admin views). */
  showStatus?: boolean;
}

function excerpt(lyrics: string, max = 110): string {
  const single = lyrics.replace(/\s+/g, " ").trim();
  return single.length > max ? `${single.slice(0, max - 1)}…` : single;
}

export function SongCard({ song, locale, dict, showStatus = false }: SongCardProps) {
  const categoryName = locale === "hi" ? song.category.nameHi : song.category.nameEn;
  return (
    <Link
      href={`/${locale}/songs/${song.id}`}
      className="group block h-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-xl"
    >
      <Card className="h-full transition-all duration-200 group-hover:-translate-y-0.5 group-hover:shadow-md">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3">
            <CardTitle className="text-base leading-snug text-foreground group-hover:text-primary">
              {song.title}
            </CardTitle>
            {showStatus ? <StatusBadge status={song.status} dict={dict} /> : null}
          </div>
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <Badge variant="secondary">
              {song.language === "hi" ? dict.songs.hindi : dict.songs.english}
            </Badge>
            <Badge variant="outline">{categoryName}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <p className="line-clamp-3 text-sm text-muted-foreground">{excerpt(song.lyrics)}</p>
          <p className="mt-4 flex items-center gap-1.5 text-sm font-medium text-primary">
            <Music2 className="h-4 w-4" aria-hidden="true" />
            {dict.songs.readLyrics}
            <ArrowRight
              className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
              aria-hidden="true"
            />
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}
