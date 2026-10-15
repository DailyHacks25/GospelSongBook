"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2 } from "lucide-react";
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
import { Button } from "@/components/ui/button";
import { api, ApiClientError } from "@/lib/api-client";
import type { Dictionary } from "@/lib/i18n/dictionaries";

export interface SongDeleteButtonProps {
  songId: string;
  songTitle: string;
  dict: Dictionary;
  /** Optional redirect after deletion (e.g. back to the list). */
  redirectAfter?: string;
  size?: "sm" | "default";
}

export function SongDeleteButton({
  songId,
  songTitle,
  dict,
  redirectAfter,
  size = "sm",
}: SongDeleteButtonProps) {
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);

  const onDelete = async () => {
    setBusy(true);
    try {
      await api.delete(`/api/songs/${songId}`);
      toast.success(dict.admin.deleteSong, { description: songTitle });
      if (redirectAfter) router.push(redirectAfter);
      router.refresh();
    } catch (error) {
      const message = error instanceof ApiClientError ? error.message : dict.errors.generic;
      toast.error(dict.errors.generic, { description: message });
    } finally {
      setBusy(false);
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" size={size} disabled={busy}>
          {busy ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <Trash2 className="h-4 w-4" aria-hidden="true" />
          )}
          {dict.admin.deleteSong}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{dict.admin.deleteSongConfirm}</AlertDialogTitle>
          <AlertDialogDescription>{dict.admin.deleteSongConfirmDesc}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{dict.admin.cancel}</AlertDialogCancel>
          <AlertDialogAction onClick={() => void onDelete()}>
            {dict.admin.confirm}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
