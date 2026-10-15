import Link from "next/link";
import { Heart, Music2 } from "lucide-react";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/lib/i18n/config";

export interface SiteFooterProps {
  locale: Locale;
  dict: Dictionary;
}

export function SiteFooter({ locale, dict }: SiteFooterProps) {
  return (
    <footer className="mt-auto border-t border-border/60 bg-card/50">
      <div className="container flex flex-col gap-6 py-10 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex max-w-md flex-col gap-2">
          <div className="flex items-center gap-2 text-foreground">
            <Music2 className="h-5 w-5 text-primary" aria-hidden="true" />
            <span className="font-semibold">WorshipJesusChrist</span>
          </div>
          <p className="text-sm text-muted-foreground">{dict.footer.rights}</p>
          <p className="text-sm text-muted-foreground">{dict.footer.builtWith}</p>
        </div>

        <div className="flex flex-col gap-2 text-sm">
          <nav className="flex flex-col gap-1.5" aria-label={dict.nav.home}>
            <Link href={`/${locale}/songs`} className="text-muted-foreground hover:text-foreground">
              {dict.nav.songs}
            </Link>
            <Link href={`/${locale}/submit`} className="text-muted-foreground hover:text-foreground">
              {dict.nav.submit}
            </Link>
            <Link href={`/${locale}/my-songs`} className="text-muted-foreground hover:text-foreground">
              {dict.nav.mySongs}
            </Link>
          </nav>
          <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
            <Heart className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" aria-hidden="true" />
            {dict.footer.unsplashNote}
          </p>
        </div>
      </div>
    </footer>
  );
}
