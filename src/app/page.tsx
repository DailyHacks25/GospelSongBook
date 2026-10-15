import Link from "next/link";
import { ArrowRight, Languages, Music2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getDictionary } from "@/lib/i18n/dictionaries";

/**
 * Bilingual landing page at `/` — the one place where both languages stand
 * side by side; everything else lives under /en or /hi.
 */
export default function LandingPage() {
  const dict = getDictionary("en");
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 py-16">
      {/* Calm light-through-clouds backdrop */}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-[radial-gradient(120%_120%_at_20%_10%,hsl(43,60%,72%)_0%,hsl(36,32%,45%)_28%,hsl(222,36%,20%)_62%,hsl(222,40%,12%)_100%)]"
      />
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-slate-950/40" />

      <div className="flex max-w-2xl flex-col items-center text-center text-white animate-fade-in">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white/10 ring-1 ring-white/30">
          <Music2 className="h-8 w-8" aria-hidden="true" />
        </span>
        <h1 className="mt-6 text-4xl font-semibold tracking-tight sm:text-5xl">
          WorshipJesusChrist
        </h1>
        <p className="mt-3 text-lg text-white/85">{dict.landing.subheading}</p>
        <p className="mt-1 flex items-center gap-2 text-sm text-white/70">
          <Languages className="h-4 w-4" aria-hidden="true" />
          {dict.landing.chooseLanguage}
        </p>
      </div>

      <div className="mt-12 grid w-full max-w-3xl gap-6 sm:grid-cols-2">
        <Card className="border-white/20 bg-white/95">
          <CardHeader>
            <CardTitle className="text-xl">English</CardTitle>
            <CardDescription>
              A Gospel song book in English — worship, prayer and seasonal songs.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild size="lg" className="w-full">
              <Link href="/en">
                {dict.landing.enterEnglish}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="border-white/20 bg-white/95">
          <CardHeader>
            <CardTitle className="text-xl" lang="hi">
              हिंदी
            </CardTitle>
            <CardDescription lang="hi">
              हिंदी में सुसमाचार गीत पुस्तिका — आराधना, प्रार्थना और पर्वों के गीत।
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild size="lg" variant="secondary" className="w-full">
              <Link href="/hi" lang="hi">
                {dict.landing.enterHindi}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
