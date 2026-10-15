import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { DEFAULT_LOCALE, isLocale } from "@/lib/i18n/config";

export const dynamic = "force-dynamic";

/**
 * `/` never shows a language picker — visitors enter the app directly in
 * their remembered language (the middleware normally redirects first; this
 * is the fallback).
 */
export default async function RootPage() {
  const cookieStore = await cookies();
  const locale = cookieStore.get("NEXT_LOCALE")?.value;
  redirect(isLocale(locale) ? `/${locale}` : `/${DEFAULT_LOCALE}`);
}
