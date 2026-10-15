import Link from "next/link";
import { Music2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-5 px-4 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
        <Music2 className="h-7 w-7 text-muted-foreground" aria-hidden="true" />
      </span>
      <h1 className="text-2xl font-semibold tracking-tight">404 — Page not found</h1>
      <p className="max-w-md text-muted-foreground">
        We could not find what you were looking for. / जो आप खोज रहे थे वह नहीं मिला।
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button asChild>
          <Link href="/en">English</Link>
        </Button>
        <Button asChild variant="secondary">
          <Link href="/hi" lang="hi">
            हिंदी
          </Link>
        </Button>
      </div>
    </div>
  );
}
