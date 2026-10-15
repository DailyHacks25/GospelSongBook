"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save, Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { api, ApiClientError } from "@/lib/api-client";
import {
  LYRICS_MAX,
  TITLE_MAX,
} from "@/lib/validation/common";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { Category, Language, Song } from "@/lib/types";

export interface SongFormProps {
  dict: Dictionary;
  categories: Category[];
  /** When present the form edits this song; otherwise it creates one. */
  song?: Song;
  /** Where to go after a successful save. */
  successRedirect: string;
}

interface FieldErrors {
  [field: string]: string | undefined;
}

export function SongForm({ dict, categories, song, successRedirect }: SongFormProps) {
  const router = useRouter();
  const editing = Boolean(song);

  const [title, setTitle] = React.useState(song?.title ?? "");
  const [language, setLanguage] = React.useState<Language | "">(song?.language ?? "");
  const [categoryId, setCategoryId] = React.useState(song?.categoryId ?? "");
  const [lyrics, setLyrics] = React.useState(song?.lyrics ?? "");
  const [errors, setErrors] = React.useState<FieldErrors>({});
  const [formError, setFormError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  const validateClient = (): FieldErrors => {
    const next: FieldErrors = {};
    if (title.trim().length === 0) next.title = dict.common.required;
    else if (title.trim().length > TITLE_MAX) next.title = dict.submit.fieldTitleHint;
    if (language !== "en" && language !== "hi") next.language = dict.common.required;
    if (!categoryId) next.categoryId = dict.common.required;
    if (lyrics.trim().length === 0) next.lyrics = dict.common.required;
    else if (lyrics.length > LYRICS_MAX) next.lyrics = dict.submit.fieldLyricsHint;
    return next;
  };

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setFormError(null);
    const clientErrors = validateClient();
    if (Object.keys(clientErrors).length > 0) {
      setErrors(clientErrors);
      setFormError(dict.errors.validation);
      return;
    }
    setErrors({});
    setSubmitting(true);
    try {
      const payload = {
        title: title.trim(),
        language: language as Language,
        categoryId,
        lyrics: lyrics.trim(),
      };
      if (editing && song) {
        await api.patch(`/api/songs/${song.id}`, payload);
        toast.success(dict.submit.saveChanges, { description: song.title });
      } else {
        await api.post("/api/songs", payload);
        toast.success(dict.submit.successTitle, { description: dict.submit.successDescription });
      }
      router.push(successRedirect);
      router.refresh();
    } catch (error) {
      if (error instanceof ApiClientError) {
        if (error.code === "validation_error" && Object.keys(error.fields).length > 0) {
          setErrors(error.fields);
          setFormError(dict.errors.validation);
        } else if (error.code === "unauthorized") {
          setFormError(dict.errors.unauthorized);
        } else {
          setFormError(error.message);
        }
      } else {
        setFormError(dict.errors.generic);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="mx-auto max-w-3xl">
      <CardHeader>
        <CardTitle>{editing ? dict.submit.editTitle : dict.submit.title}</CardTitle>
        <CardDescription>
          {editing ? dict.submit.editSubtitle : dict.submit.subtitle}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="grid gap-6" onSubmit={onSubmit} noValidate>
          {formError ? (
            <p
              role="alert"
              className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
            >
              {formError}
            </p>
          ) : null}

          <div className="grid gap-2">
            <Label htmlFor="song-title">
              {dict.submit.fieldTitle} <span className="text-muted-foreground">*</span>
            </Label>
            <Input
              id="song-title"
              value={title}
              maxLength={TITLE_MAX}
              onChange={(event) => setTitle(event.target.value)}
              aria-invalid={Boolean(errors.title)}
              aria-describedby="song-title-hint"
              placeholder={dict.submit.fieldTitle}
            />
            <div className="flex items-center justify-between gap-2">
              <p id="song-title-hint" className="text-xs text-muted-foreground">
                {errors.title ?? dict.submit.fieldTitleHint}
              </p>
              <p className="text-xs tabular-nums text-muted-foreground">
                {dict.submit.charCount
                  .replace("{count}", String(title.length))
                  .replace("{max}", String(TITLE_MAX))}
              </p>
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="song-language">
                {dict.submit.fieldLanguage} <span className="text-muted-foreground">*</span>
              </Label>
              <Select
                value={language}
                onValueChange={(value) => setLanguage(value as Language)}
              >
                <SelectTrigger id="song-language" aria-invalid={Boolean(errors.language)}>
                  <SelectValue placeholder={dict.submit.chooseLanguage} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">{dict.songs.english}</SelectItem>
                  <SelectItem value="hi">{dict.songs.hindi}</SelectItem>
                </SelectContent>
              </Select>
              {errors.language ? (
                <p className="text-xs text-destructive">{errors.language}</p>
              ) : null}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="song-category">
                {dict.submit.fieldCategory} <span className="text-muted-foreground">*</span>
              </Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger id="song-category" aria-invalid={Boolean(errors.categoryId)}>
                  <SelectValue placeholder={dict.submit.chooseCategory} />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.nameEn} · {category.nameHi}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.categoryId ? (
                <p className="text-xs text-destructive">{errors.categoryId}</p>
              ) : null}
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="song-lyrics">
              {dict.submit.fieldLyrics} <span className="text-muted-foreground">*</span>
            </Label>
            <Textarea
              id="song-lyrics"
              value={lyrics}
              rows={16}
              maxLength={LYRICS_MAX}
              onChange={(event) => setLyrics(event.target.value)}
              aria-invalid={Boolean(errors.lyrics)}
              aria-describedby="song-lyrics-hint"
              className="min-h-[18rem] font-medium leading-relaxed"
              placeholder={dict.submit.fieldLyricsHint}
            />
            <div className="flex items-center justify-between gap-2">
              <p id="song-lyrics-hint" className="text-xs text-muted-foreground">
                {errors.lyrics ?? dict.submit.fieldLyricsHint}
              </p>
              <p className="text-xs tabular-nums text-muted-foreground">
                {dict.submit.charCount
                  .replace("{count}", String(lyrics.length))
                  .replace("{max}", LYRICS_MAX.toLocaleString())}
              </p>
            </div>
          </div>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={submitting}
            >
              {dict.submit.cancel}
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : editing ? (
                <Save className="h-4 w-4" aria-hidden="true" />
              ) : (
                <Send className="h-4 w-4" aria-hidden="true" />
              )}
              {submitting
                ? dict.submit.submitting
                : editing
                  ? dict.submit.saveChanges
                  : dict.submit.submit}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
