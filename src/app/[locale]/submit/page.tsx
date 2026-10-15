import Link from "next/link";
import { LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SongForm } from "@/components/songs/song-form";
import { getDb } from "@/lib/db/index";
import { listCategories } from "@/lib/db/queries/categories";
import { getPageContext } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

export default async function SubmitPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: localeParam } = await params;
  const { locale, dict, user } = await getPageContext(localeParam);

  if (!user) {
    return (
      <div className="container flex flex-col items-center py-16">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>{dict.submit.signInRequired}</CardTitle>
            <CardDescription>{dict.submit.signInRequiredDesc}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild size="lg" className="w-full">
              <Link href={`/${locale}/signin?callbackUrl=/${locale}/submit`}>
                <LogIn className="h-4 w-4" aria-hidden="true" />
                {dict.nav.signIn}
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container flex flex-col gap-8 py-10">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">{dict.submit.title}</h1>
        <p className="max-w-2xl text-muted-foreground">{dict.submit.subtitle}</p>
      </header>
      <SongForm dict={dict} categories={listCategories(getDb())} successRedirect={`/${locale}/my-songs`} />
    </div>
  );
}
