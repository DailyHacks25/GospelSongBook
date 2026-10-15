/** Server-side helpers shared by pages. */

import { cache } from "react";
import { auth } from "@/lib/auth/auth";
import { getDb } from "@/lib/db/index";
import { getUserById } from "@/lib/db/queries/users";
import { localeFromParam, type Locale } from "@/lib/i18n/config";
import { getDictionary, type Dictionary } from "@/lib/i18n/dictionaries";
import type { SessionUser } from "@/lib/types";

export interface PageContext {
  locale: Locale;
  dict: Dictionary;
  user: SessionUser | null;
}

/** Resolve locale + dictionary + the signed-in user (with a fresh DB role). */
export const getPageContext = cache(async (localeParam: string | undefined): Promise<PageContext> => {
  const locale = localeFromParam(localeParam);
  const dict = getDictionary(locale);
  const user = await getCurrentUser();
  return { locale, dict, user };
});

export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  try {
    const session = await auth();
    const id = session?.user?.id;
    if (!id) return null;
    const user = getUserById(getDb(), id);
    if (!user) return null;
    return { id: user.id, email: user.email, name: user.name, role: user.role };
  } catch {
    return null;
  }
});
