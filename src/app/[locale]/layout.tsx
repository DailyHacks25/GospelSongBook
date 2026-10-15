import { notFound } from "next/navigation";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { isLocale } from "@/lib/i18n/config";
import { getPageContext } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale: localeParam } = await params;
  if (!isLocale(localeParam)) notFound();
  const { locale, dict, user } = await getPageContext(localeParam);

  return (
    <>
      <SiteHeader locale={locale} dict={dict} user={user} />
      <main className="flex-1">{children}</main>
      <SiteFooter locale={locale} dict={dict} />
    </>
  );
}
