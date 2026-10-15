"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { api, ApiClientError } from "@/lib/api-client";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { Category } from "@/lib/types";

export interface CategoryManagerProps {
  categories: Category[];
  dict: Dictionary;
}

interface FormState {
  slug: string;
  nameEn: string;
  nameHi: string;
  sortOrder: string;
}

const EMPTY_FORM: FormState = { slug: "", nameEn: "", nameHi: "", sortOrder: "0" };

export function CategoryManager({ categories, dict }: CategoryManagerProps) {
  const router = useRouter();
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [form, setForm] = React.useState<FormState>(EMPTY_FORM);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [busy, setBusy] = React.useState(false);

  const startEdit = (category: Category) => {
    setEditingId(category.id);
    setForm({
      slug: category.slug,
      nameEn: category.nameEn,
      nameHi: category.nameHi,
      sortOrder: String(category.sortOrder),
    });
    setErrors({});
  };

  const resetForm = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setErrors({});
  };

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setErrors({});
    const payload = {
      slug: form.slug.trim().toLowerCase(),
      nameEn: form.nameEn.trim(),
      nameHi: form.nameHi.trim(),
      sortOrder: Number(form.sortOrder) || 0,
    };
    try {
      if (editingId) {
        await api.patch(`/api/categories/${editingId}`, payload);
        toast.success(dict.admin.updateCategory, { description: payload.nameEn });
      } else {
        await api.post("/api/categories", payload);
        toast.success(dict.admin.addCategory, { description: payload.nameEn });
      }
      resetForm();
      router.refresh();
    } catch (error) {
      if (error instanceof ApiClientError) {
        if (Object.keys(error.fields).length > 0) setErrors(error.fields);
        toast.error(error.message);
      } else {
        toast.error(dict.errors.generic);
      }
    } finally {
      setBusy(false);
    }
  };

  const onDelete = async (category: Category) => {
    setBusy(true);
    try {
      await api.delete(`/api/categories/${category.id}`);
      toast.success(dict.admin.deleteCategory, { description: category.nameEn });
      if (editingId === category.id) resetForm();
      router.refresh();
    } catch (error) {
      const message =
        error instanceof ApiClientError && error.code === "conflict"
          ? dict.admin.deleteCategoryBlocked
          : error instanceof ApiClientError
            ? error.message
            : dict.errors.generic;
      toast.error(dict.errors.generic, { description: message });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
      <Card>
        <CardHeader>
          <CardTitle>{dict.admin.categoriesTitle}</CardTitle>
          <CardDescription>{dict.admin.categoriesSubtitle}</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{dict.admin.categorySlug}</TableHead>
                <TableHead>{dict.admin.categoryNameEn}</TableHead>
                <TableHead>{dict.admin.categoryNameHi}</TableHead>
                <TableHead className="text-right">{dict.admin.categorySortOrder}</TableHead>
                <TableHead className="text-right">{dict.mySongs.actions}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.map((category) => (
                <TableRow key={category.id}>
                  <TableCell>
                    <Badge variant="outline">{category.slug}</Badge>
                  </TableCell>
                  <TableCell>{category.nameEn}</TableCell>
                  <TableCell lang="hi">{category.nameHi}</TableCell>
                  <TableCell className="text-right tabular-nums">{category.sortOrder}</TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => startEdit(category)}
                        disabled={busy}
                      >
                        <Pencil className="h-4 w-4" aria-hidden="true" />
                        {dict.admin.editSong}
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="sm" disabled={busy}>
                            <Trash2 className="h-4 w-4" aria-hidden="true" />
                            {dict.admin.deleteCategory}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>{dict.admin.deleteCategoryConfirm}</AlertDialogTitle>
                            <AlertDialogDescription>
                              {category.nameEn} · {category.nameHi}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>{dict.admin.cancel}</AlertDialogCancel>
                            <AlertDialogAction onClick={() => void onDelete(category)}>
                              {dict.admin.confirm}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="h-fit">
        <CardHeader>
          <CardTitle>
            {editingId ? dict.admin.updateCategory : dict.admin.addCategory}
          </CardTitle>
          <CardDescription>{dict.admin.manageCategoriesDesc}</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4" onSubmit={onSubmit} noValidate>
            <div className="grid gap-2">
              <Label htmlFor="category-slug">{dict.admin.categorySlug}</Label>
              <Input
                id="category-slug"
                value={form.slug}
                maxLength={40}
                placeholder="e.g. worship"
                onChange={(event) => setForm((f) => ({ ...f, slug: event.target.value }))}
                aria-invalid={Boolean(errors.slug)}
                disabled={Boolean(editingId)}
              />
              {errors.slug ? <p className="text-xs text-destructive">{errors.slug}</p> : null}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="category-name-en">{dict.admin.categoryNameEn}</Label>
              <Input
                id="category-name-en"
                value={form.nameEn}
                maxLength={60}
                onChange={(event) => setForm((f) => ({ ...f, nameEn: event.target.value }))}
                aria-invalid={Boolean(errors.nameEn)}
              />
              {errors.nameEn ? <p className="text-xs text-destructive">{errors.nameEn}</p> : null}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="category-name-hi" lang="hi">
                {dict.admin.categoryNameHi}
              </Label>
              <Input
                id="category-name-hi"
                value={form.nameHi}
                maxLength={60}
                lang="hi"
                onChange={(event) => setForm((f) => ({ ...f, nameHi: event.target.value }))}
                aria-invalid={Boolean(errors.nameHi)}
              />
              {errors.nameHi ? <p className="text-xs text-destructive">{errors.nameHi}</p> : null}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="category-sort">{dict.admin.categorySortOrder}</Label>
              <Input
                id="category-sort"
                type="number"
                min={0}
                max={10000}
                value={form.sortOrder}
                onChange={(event) => setForm((f) => ({ ...f, sortOrder: event.target.value }))}
                aria-invalid={Boolean(errors.sortOrder)}
              />
              {errors.sortOrder ? (
                <p className="text-xs text-destructive">{errors.sortOrder}</p>
              ) : null}
            </div>
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              {editingId ? (
                <Button type="button" variant="outline" onClick={resetForm} disabled={busy}>
                  {dict.admin.cancel}
                </Button>
              ) : null}
              <Button type="submit" disabled={busy}>
                {busy ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Plus className="h-4 w-4" aria-hidden="true" />
                )}
                {editingId ? dict.admin.updateCategory : dict.admin.addCategory}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
