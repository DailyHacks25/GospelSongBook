import { Camera } from "lucide-react";
import type { BackgroundImage } from "@/lib/types";

export interface AttributionProps {
  image: BackgroundImage;
  label: string;
  className?: string;
}

/**
 * Unsplash attribution, per the API guidelines: credit the photographer and
 * link both their profile and the photo page on Unsplash.
 * ("Photo by {name} on Unsplash")
 */
export function Attribution({ image, label, className }: AttributionProps) {
  const text = label.replace("{photographer}", image.photographer);
  return (
    <p className={className}>
      <a
        href={image.photographerUrl}
        target="_blank"
        rel="noopener noreferrer nofollow"
        className="underline decoration-white/30 underline-offset-2 hover:decoration-white"
      >
        <Camera className="mr-1 inline h-3.5 w-3.5" aria-hidden="true" />
        {text}
      </a>
      {" — "}
      <a
        href={image.unsplashUrl}
        target="_blank"
        rel="noopener noreferrer nofollow"
        className="underline decoration-white/30 underline-offset-2 hover:decoration-white"
      >
        Unsplash
      </a>
    </p>
  );
}
