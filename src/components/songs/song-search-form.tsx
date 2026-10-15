"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SEARCH_QUERY_MAX } from "@/lib/validation/common";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { Category, Language } from "@/lib/types";

const ALL = "all";

export interface SongSearchFormProps {
  dict: Dictionary;
  categories: Category[];
  /** Current values (from the server) so the form is shareable via URL. */
  initialQuery?: string;
  initialCategory?: string;
  initialLanguage?: string;
}

export function SongSearchForm({
  dict,
  categories,
  initialQuery = "",
  initialCategory = "",
  initialLanguage = "",
}: SongSearchFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = React.useState(initialQuery);
  const [category, setCategory] = React.useState(initialCategory || ALL);
  const [language, setLanguage] = React.useState(initialLanguage || ALL);

  const applyFilters = React.useCallback(
    (next: { q?: string; category?: string; language?: string }) => {
      const params = new URLSearchParams(searchParams?.toString() ?? "");
      const q = (next.q ?? query).trim();
      const cat = next.category ?? category;
      const lang = next.language ?? language;
      if (q) params.set("q", q.slice(0, SEARCH_QUERY_MAX));
      else params.delete("q");
      if (cat && cat !== ALL) params.set("category", cat);
      else params.delete("category");
      if (lang && lang !== ALL) params.set("language", lang as Language);
      else params.delete("language");
      params.delete("page");
      router.push(`?${params.toString()}`, { scroll: false });
    },
    [router, searchParams, query, category, language],
  );

  return (
    <form
      role="search"
      className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_auto_auto_auto]"
      onSubmit={(event) => {
        event.preventDefault();
        applyFilters({});
      }}
    >
      <div className="flex flex-col gap-1.5 sm:col-span-2 lg:col-span-1">
        <Label htmlFor="song-search" className="sr-only">
          {dict.songs.searchLabel}
        </Label>
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            id="song-search"
            type="search"
            value={query}
            maxLength={SEARCH_QUERY_MAX}
            placeholder={dict.songs.searchPlaceholder}
            className="pl-9"
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="song-language" className="sr-only">
          {dict.songs.language}
        </Label>
        <Select
          value={language}
          onValueChange={(value) => {
            setLanguage(value);
            applyFilters({ language: value });
          }}
        >
          <SelectTrigger id="song-language" className="w-full sm:w-40">
            <SelectValue placeholder={dict.songs.allLanguages} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>{dict.songs.allLanguages}</SelectItem>
            <SelectItem value="en">{dict.songs.english}</SelectItem>
            <SelectItem value="hi">{dict.songs.hindi}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="song-category" className="sr-only">
          {dict.songs.category}
        </Label>
        <Select
          value={category}
          onValueChange={(value) => {
            setCategory(value);
            applyFilters({ category: value });
          }}
        >
          <SelectTrigger id="song-category" className="w-full sm:w-52">
            <SelectValue placeholder={dict.songs.allCategories} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>{dict.songs.allCategories}</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.slug}>
                {cat.nameEn} · {cat.nameHi}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Button type="submit" className="sm:w-auto">
        <Search className="h-4 w-4" aria-hidden="true" />
        {dict.home.search}
      </Button>
    </form>
  );
}
