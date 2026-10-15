import Link from "next/link";
import { Music2 } from "lucide-react";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { UserMenu } from "@/components/layout/user-menu";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/lib/i18n/config";
import type { SessionUser } from "@/lib/types";

export interface SiteHeaderProps {
  locale: Locale;
  dict: Dictionary;
  user: SessionUser | null;
}

export function SiteHeader({ locale, dict, user }: SiteHeaderProps) {
  const navItems = [
    { href: `/${locale}/songs`, label: dict.nav.songs },
    { href: `/${locale}/submit`, label: dict.nav.submit },
    { href: `/${locale}/my-songs`, label: dict.nav.mySongs },
    ...(user?.role === "admin" ? [{ href: `/${locale}/admin`, label: dict.nav.admin }] : []),
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/85 backdrop-blur-md">
      <div className="container flex h-16 items-center justify-between gap-4">
        <Link
          href={`/${locale}`}
          className="flex items-center gap-2.5 text-foreground transition-colors hover:text-primary"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Music2 className="h-5 w-5" aria-hidden="true" />
          </span>
          <span className="flex flex-col leading-tight">
            <span className="text-base font-semibold tracking-tight">WorshipJesusChrist</span>
            <span className="text-[11px] text-muted-foreground">{dict.meta.tagline}</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label={dict.nav.home}>
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <LanguageSwitcher
            locale={locale}
            labels={{ switchLanguage: dict.nav.switchLanguage, language: dict.nav.language }}
          />
          <UserMenu user={user} locale={locale} dict={dict} />
        </div>
      </div>

      {/* Mobile navigation */}
      <nav
        className="flex items-center gap-1 overflow-x-auto border-t border-border/60 px-4 py-2 md:hidden"
        aria-label={dict.nav.home}
      >
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
