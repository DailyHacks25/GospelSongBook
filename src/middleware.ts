import { NextResponse, type NextRequest } from "next/server";
import { DEFAULT_LOCALE, isLocale } from "@/lib/i18n/config";

/**
 * Locale middleware:
 *  - keeps every app page under a /en or /hi prefix so links stay shareable,
 *  - forwards the active locale to the server tree via a request header so
 *    <html lang> is correct on the very first request,
 *  - persists the choice in a cookie (used outside the locale routes).
 *
 * `/` is the bilingual landing page and is left untouched.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Never touch API routes, Next internals or files with extensions.
  if (
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname.includes(".") // files: favicon.ico, icon.svg, robots.txt, …
  ) {
    return passThrough(request, cookieLocale(request) ?? DEFAULT_LOCALE);
  }

  const first = pathname.split("/")[1];
  const localeFromPath = isLocale(first) ? first : null;

  if (localeFromPath) {
    return passThrough(request, localeFromPath, { remember: true });
  }

  if (pathname === "/") {
    // Bilingual landing page lives at app/page.tsx.
    return passThrough(request, cookieLocale(request) ?? DEFAULT_LOCALE);
  }

  // Unknown top-level segment: treat it as an app path missing its locale.
  const url = request.nextUrl.clone();
  url.pathname = `/${DEFAULT_LOCALE}${pathname}`;
  return NextResponse.redirect(url);
}

function passThrough(
  request: NextRequest,
  locale: string,
  options?: { remember?: boolean },
): NextResponse {
  const headers = new Headers(request.headers);
  headers.set("x-next-locale", locale);
  const response = NextResponse.next({ request: { headers } });
  if (options?.remember) {
    response.cookies.set("NEXT_LOCALE", locale, {
      path: "/",
      maxAge: 31_536_000,
      sameSite: "lax",
    });
  }
  return response;
}

function cookieLocale(request: NextRequest): string | null {
  const value = request.cookies.get("NEXT_LOCALE")?.value;
  return isLocale(value) ? value : null;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
