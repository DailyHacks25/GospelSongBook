"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Languages } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LOCALES, LOCALE_NAMES, type Locale } from "@/lib/i18n/config";

function swapLocaleInPath(pathname: string, nextLocale: Locale): string {
  const segments = pathname.split("/");
  if (LOCALES.includes(segments[1] as Locale)) {
    segments[1] = nextLocale;
    return segments.join("/") || `/${nextLocale}`;
  }
  return `/${nextLocale}${pathname === "/" ? "" : pathname}`;
}

export interface LanguageSwitcherProps {
  locale: Locale;
  labels: { switchLanguage: string; language: string };
  /** Render as plain links (server contexts) instead of a dropdown. */
  variant?: "dropdown" | "links";
}

export function LanguageSwitcher({ locale, labels, variant = "dropdown" }: LanguageSwitcherProps) {
  const pathname = usePathname() ?? `/${locale}`;

  const rememberLocale = (next: Locale) => {
    document.cookie = `NEXT_LOCALE=${next}; path=/; max-age=31536000; samesite=lax`;
  };

  if (variant === "links") {
    return (
      <div className="flex items-center gap-1" aria-label={labels.language}>
        {LOCALES.map((l) => (
          <Link
            key={l}
            href={swapLocaleInPath(pathname, l)}
            onClick={() => rememberLocale(l)}
            aria-current={l === locale ? "true" : undefined}
            className={
              l === locale
                ? "rounded-md bg-primary px-2.5 py-1 text-xs font-semibold text-primary-foreground"
                : "rounded-md px-2.5 py-1 text-xs font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            }
          >
            {LOCALE_NAMES[l]}
          </Link>
        ))}
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2" aria-label={labels.switchLanguage}>
          <Languages className="h-4 w-4" />
          <span className="hidden sm:inline">{LOCALE_NAMES[locale]}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {LOCALES.map((l) => (
          <DropdownMenuItem key={l} asChild>
            <Link
              href={swapLocaleInPath(pathname, l)}
              onClick={() => rememberLocale(l)}
              className={l === locale ? "font-semibold" : undefined}
            >
              {LOCALE_NAMES[l]}
            </Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
