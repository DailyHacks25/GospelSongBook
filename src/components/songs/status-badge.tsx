import { Badge } from "@/components/ui/badge";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { SongStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

const VARIANT: Record<SongStatus, "success" | "warning" | "destructive"> = {
  approved: "success",
  pending: "warning",
  rejected: "destructive",
};

export interface StatusBadgeProps {
  status: SongStatus;
  dict: Dictionary;
  className?: string;
}

export function StatusBadge({ status, dict, className }: StatusBadgeProps) {
  return (
    <Badge variant={VARIANT[status]} className={cn("shrink-0", className)}>
      {dict.status[status]}
    </Badge>
  );
}
