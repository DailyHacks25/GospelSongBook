import Link from "next/link";
import { ArrowRight, BookOpen, Music2, Search, ShieldCheck, UploadCloud } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SongCard } from "@/components/songs/song-card";
import { SongSearchForm } from "@/components/songs/song-search-form";
import { getDb } from "@/lib/db/index";
import { listCategories } from "@/lib/db/queries/categories";
import { listSongs } from "@/lib/db/queries/songs";
import { getPageContext } from "@/lib/i18n/server";
import { FALLBACK_GRADIENT_CLASS } from "@/lib/unsplash/filter";

export const dynamic = "force-dynamic";

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: localeParam } = await params;
  const { locale, dict } = await getPageContext(localeParam);
  const db = getDb();
  const categories = listCategories(db);
  const recentSongs = listSongs(db, { statuses: ["approved"], limit: 6 });

  return (
    <div className="flex flex-col gap-16 pb-16">
      {/* Hero */}
      <section className="relative isolate overflow-hidden">
        <div
          aria-hidden="true"
          className={`absolute inset-0 -z-10 ${FALLBACK_GRADIENT_CLASS}`}
          role="img"
          aria-label={dict.songs.backgroundFallback}
        />
        <div aria-hidden="true" className="absolute inset-0 -z-10 bg-slate-950/45" />
        <div className="container flex flex-col items-start gap-6 py-20 text-white sm:py-24">
          <Badge className="bg-white/15 text-white ring-1 ring-white/25 hover:bg-white/20">
            <Music2 className="h-3.5 w-3.5" aria-hidden="true" />
            {dict.meta.tagline}
          </Badge>
          <h1 className="max-w-2xl text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
            {dict.home.heroTitle}
          </h1>
          <p className="max-w-xl text-balance text-lg leading-relaxed text-white/85">
            {dict.home.heroSubtitle}
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Button asChild size="lg" className="bg-white text-slate-900 hover:bg-white/90">
              <Link href={`/${locale}/songs`}>
                <BookOpen className="h-4 w-4" aria-hidden="true" />
                {dict.nav.songs}
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-white/40 bg-transparent text-white hover:bg-white/10 hover:text-white"
            >
              <Link href={`/${locale}/submit`}>
                <UploadCloud className="h-4 w-4" aria-hidden="true" />
                {dict.home.submitSong}
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <div className="container flex flex-col gap-16">
        {/* Search */}
        <section aria-label={dict.home.search}>
          <SongSearchForm dict={dict} categories={categories} />
        </section>

        {/* Categories */}
        <section className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <h2 className="text-2xl font-semibold tracking-tight">{dict.home.browseByCategory}</h2>
            <p className="text-muted-foreground">{dict.home.categoriesSubtitle}</p>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/${locale}/songs?category=${encodeURIComponent(category.slug)}`}
                className="group rounded-xl border border-border bg-card p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex flex-col gap-1">
                    <span className="font-semibold text-foreground group-hover:text-primary">
                      {locale === "hi" ? category.nameHi : category.nameEn}
                    </span>
                    <span
                      className="text-sm text-muted-foreground"
                      lang={locale === "hi" ? "en" : "hi"}
                    >
                      {locale === "hi" ? category.nameEn : category.nameHi}
                    </span>
                  </div>
                  <ArrowRight
                    className="h-5 w-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary"
                    aria-hidden="true"
                  />
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Recent songs */}
        <section className="flex flex-col gap-6">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div className="flex flex-col gap-2">
              <h2 className="text-2xl font-semibold tracking-tight">{dict.home.recentSongs}</h2>
              <p className="text-muted-foreground">{dict.home.recentSubtitle}</p>
            </div>
            <Button asChild variant="outline">
              <Link href={`/${locale}/songs`}>
                {dict.home.viewAllSongs}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </Button>
          </div>

          {recentSongs.length === 0 ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{dict.songs.noResults}</CardTitle>
                <CardDescription>{dict.songs.noResultsHint}</CardDescription>
              </CardHeader>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {recentSongs.map((song) => (
                <SongCard key={song.id} song={song} locale={locale} dict={dict} />
              ))}
            </div>
          )}
        </section>

        {/* How it works */}
        <section className="flex flex-col gap-6">
          <h2 className="text-2xl font-semibold tracking-tight">{dict.home.howItWorks}</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {[
              {
                icon: ShieldCheck,
                title: dict.home.stepSignIn,
                desc: dict.home.stepSignInDesc,
              },
              {
                icon: UploadCloud,
                title: dict.home.stepSubmit,
                desc: dict.home.stepSubmitDesc,
              },
              {
                icon: Search,
                title: dict.home.stepReview,
                desc: dict.home.stepReviewDesc,
              },
            ].map((step, index) => (
              <Card key={index}>
                <CardHeader>
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <step.icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <CardTitle className="pt-2 text-base">{step.title}</CardTitle>
                  <CardDescription>{step.desc}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
