"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { api, ApiClientError } from "@/lib/api-client";
import { REVIEW_NOTE_MAX } from "@/lib/validation/common";
import type { Dictionary } from "@/lib/i18n/dictionaries";

export interface ReviewActionsProps {
  songId: string;
  songTitle: string;
  dict: Dictionary;
}

export function ReviewActions({ songId, songTitle, dict }: ReviewActionsProps) {
  const router = useRouter();
  const [open, setOpen] = React.useState<"approve" | "reject" | null>(null);
  const [note, setNote] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  const submitReview = async () => {
    if (!open) return;
    setBusy(true);
    try {
      await api.post(`/api/songs/${songId}/review`, {
        action: open,
        note: note.trim() || undefined,
      });
      toast.success(
        open === "approve" ? dict.admin.approve : dict.admin.reject,
        { description: songTitle },
      );
      setOpen(null);
      setNote("");
      router.refresh();
    } catch (error) {
      const message =
        error instanceof ApiClientError ? error.message : dict.errors.generic;
      toast.error(dict.errors.generic, { description: message });
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <Button
          size="sm"
          className="bg-emerald-700 text-white hover:bg-emerald-800"
          onClick={() => setOpen("approve")}
        >
          <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
          {dict.admin.approve}
        </Button>
        <Button size="sm" variant="destructive" onClick={() => setOpen("reject")}>
          <XCircle className="h-4 w-4" aria-hidden="true" />
          {dict.admin.reject}
        </Button>
      </div>

      <Dialog open={open !== null} onOpenChange={(value) => !value && setOpen(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {open === "approve" ? dict.admin.approveConfirmTitle : dict.admin.rejectConfirmTitle}
            </DialogTitle>
            <DialogDescription>
              {open === "approve"
                ? dict.admin.approveConfirmDescription
                : dict.admin.rejectConfirmDescription}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-2">
            <Label htmlFor="review-note">
              {open === "reject" ? dict.admin.reviewNote : dict.admin.reviewNoteOptional}
            </Label>
            <Textarea
              id="review-note"
              value={note}
              maxLength={REVIEW_NOTE_MAX}
              rows={3}
              onChange={(event) => setNote(event.target.value)}
              placeholder={dict.admin.reviewNote}
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(null)} disabled={busy}>
              {dict.admin.cancel}
            </Button>
            <Button
              onClick={() => void submitReview()}
              disabled={busy}
              variant={open === "reject" ? "destructive" : "default"}
              className={open === "approve" ? "bg-emerald-700 hover:bg-emerald-800" : undefined}
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
              {dict.admin.confirm}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
