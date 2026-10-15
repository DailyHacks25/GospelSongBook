import { Attribution } from "@/components/backgrounds/attribution";
import { FALLBACK_GRADIENT_CLASS } from "@/lib/unsplash/filter";
import type { BackgroundImage } from "@/lib/types";
import { cn } from "@/lib/utils";

export interface SongBackgroundProps {
  image: BackgroundImage | null;
  /** Localized "Photo by {photographer} on Unsplash" label. */
  attributionLabel: string;
  /** Accessible description of the fallback gradient. */
  fallbackLabel: string;
  /** Content rendered above the background and gradient overlay. */
  children: React.ReactNode;
  className?: string;
}

/**
 * Full-bleed song background: hotlinked Unsplash photo (when available and
 * safe) or a calm sky gradient, with a dark vertical gradient overlay so
 * lyrics stay readable in every condition.
 */
export function SongBackground({
  image,
  attributionLabel,
  fallbackLabel,
  children,
  className,
}: SongBackgroundProps) {
  return (
    <div
      className={cn(
        "relative isolate overflow-hidden rounded-2xl",
        !image && FALLBACK_GRADIENT_CLASS,
        className,
      )}
      role="img"
      aria-label={image ? image.alt : fallbackLabel}
    >
      {image ? (
        // Hotlinked from images.unsplash.com per the Unsplash API guidelines.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={image.url}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 -z-10 h-full w-full object-cover"
          loading="lazy"
          decoding="async"
        />
      ) : null}

      {/* Readability overlay — dark from the bottom, soft at the top. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-gradient-to-b from-slate-950/70 via-slate-950/80 to-slate-950/95"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-gradient-to-r from-slate-950/60 via-transparent to-slate-950/40"
      />

      <div className="relative">{children}</div>

      {image ? (
        <div className="absolute bottom-3 right-4 text-[11px] text-white/70">
          <Attribution image={image} label={attributionLabel} />
        </div>
      ) : null}
    </div>
  );
}
