import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

/** Inline branded placeholder — never 404s, works offline and on any host. */
const PLACEHOLDER =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400">
      <rect width="400" height="400" fill="#eef2f7"/>
      <g fill="none" stroke="#9db0c9" stroke-width="10" stroke-linejoin="round">
        <rect x="120" y="150" width="160" height="100" rx="8"/>
        <path d="M120 220l40-35 35 30 30-25 55 40"/>
      </g>
      <circle cx="250" cy="182" r="12" fill="#9db0c9"/>
      <text x="200" y="300" text-anchor="middle" font-family="Poppins,Arial,sans-serif"
        font-size="22" fill="#7c8ea6">Image unavailable</text>
    </svg>`,
  );

type Props = {
  src?: string | null;
  alt: string;
  className?: string;
  /** Skip lazy loading for above-the-fold images. */
  eager?: boolean;
};

/**
 * Product/media image with a guaranteed fallback. If the stored file is
 * missing, moved, or the storage host is unreachable, a branded placeholder
 * is shown instead of a broken image icon.
 */
export function ProductImage({ src, alt, className, eager }: Props) {
  const [failed, setFailed] = useState(false);

  // Reset the error state when the source changes (e.g. after re-upload).
  useEffect(() => setFailed(false), [src]);

  const resolved = !src || failed ? PLACEHOLDER : src;

  return (
    <img
      src={resolved}
      alt={alt}
      loading={eager ? "eager" : "lazy"}
      decoding="async"
      onError={() => setFailed(true)}
      className={cn("size-full object-cover", className)}
    />
  );
}