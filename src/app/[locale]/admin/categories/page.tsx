import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CategoryManager } from "@/components/admin/category-manager";
import { getDb } from "@/lib/db/index";
import { listCategories } from "@/lib/db/queries/categories";
import { getPageContext } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: localeParam } = await params;
  const { locale, dict, user } = await getPageContext(localeParam);

  if (!user) redirect(`/${locale}/signin?callbackUrl=/${locale}/admin/categories`);
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

  return (
    <div className="container flex flex-col gap-8 py-10">
      <Button asChild variant="ghost" size="sm" className="w-fit gap-1.5">
        <Link href={`/${locale}/admin`}>
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          {dict.admin.dashboard}
        </Link>
      </Button>
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">{dict.admin.categoriesTitle}</h1>
        <p className="max-w-2xl text-muted-foreground">{dict.admin.categoriesSubtitle}</p>
      </header>
      <CategoryManager categories={listCategories(getDb())} dict={dict} />
    </div>
  );
}
