import type { Metadata, Viewport } from "next";
import { cookies, headers } from "next/headers";
import { Toaster } from "@/components/ui/sonner";
import { DEFAULT_LOCALE, isLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import "@/app/globals.css";

// Devanagari-capable + Latin web fonts (self-hosted via @fontsource — no
// runtime calls to Google Fonts, which keeps the site fast and privacy-friendly).
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/700.css";
import "@fontsource/noto-sans-devanagari/400.css";
import "@fontsource/noto-sans-devanagari/500.css";
import "@fontsource/noto-sans-devanagari/600.css";
import "@fontsource/noto-sans-devanagari/700.css";

export const metadata: Metadata = {
  title: {
    default: "WorshipJesusChrist — Gospel Song Book",
    template: "%s · WorshipJesusChrist",
  },
  description:
    "A bilingual (English and Hindi) Gospel song book with worship, prayer, Easter, Good Friday, Palm Sunday and Christmas songs.",
  applicationName: "WorshipJesusChrist",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#22315c",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // <html lang> follows the active locale (set by the middleware header on
  // every request, falling back to the visitor's last choice) so assistive
  // tech and font shaping pick the right rules from the very first paint.
  const headerStore = await headers();
  const cookieStore = await cookies();
  const headerLocale = headerStore.get("x-next-locale");
  const cookieLocale = cookieStore.get("NEXT_LOCALE")?.value;
  const locale = isLocale(headerLocale)
    ? headerLocale
    : isLocale(cookieLocale)
      ? cookieLocale
      : DEFAULT_LOCALE;
  const dict = getDictionary(locale);

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className="flex min-h-screen flex-col font-sans">
        {children}
        <Toaster />
        <noscript>
          <p className="container py-4 text-sm text-muted-foreground">{dict.common.loading}</p>
        </noscript>
      </body>
    </html>
  );
}
