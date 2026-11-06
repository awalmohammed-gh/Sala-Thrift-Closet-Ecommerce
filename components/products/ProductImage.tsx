"use client";

import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils";

const PLACEHOLDER = "/images/placeholders/product.svg";

interface ProductImageProps {
  src: string | null | undefined;
  alt: string;
  sizes: string;
  priority?: boolean;
  className?: string;
  fit?: "cover" | "contain";
}

/** Fills its (relatively positioned, fixed-ratio) parent. Missing or broken photos show a branded placeholder. */
export function ProductImage({ src, alt, sizes, priority, className, fit = "cover" }: ProductImageProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const usable = src && src !== failedSrc ? src : null;
  return (
    <Image
      src={usable || PLACEHOLDER}
      alt={usable ? alt : ""}
      fill
      sizes={sizes}
      loading={priority ? "eager" : undefined}
      onError={() => setFailedSrc(usable)}
      className={cn(fit === "contain" || !usable ? "object-contain" : "object-cover", className)}
    />
  );
}
