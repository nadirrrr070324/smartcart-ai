import { useState } from "react";
import type { Product } from "../../types";
import { cn } from "../../utils/cn";

interface ProductImageProps {
  product: Pick<Product, "name" | "emoji" | "image">;
  /** e.g. "h-12 w-12 rounded-xl text-2xl" — upgrade to "h-40 w-full rounded-2xl" for hero cards */
  className?: string;
  imgClassName?: string;
  eager?: boolean;
}

/**
 * Real product photo with an emoji fallback.
 * If the product has no image URL, or the URL fails to load
 * (offline, hotlink blocked, wrong ID), the emoji tile renders instead.
 */
export function ProductImage({ product, className, imgClassName, eager }: ProductImageProps) {
  const [failed, setFailed] = useState(false);
  const showImg = Boolean(product.image) && !failed;

  if (!showImg) {
    return (
      <div
        role="img"
        aria-label={product.name}
        className={cn(
          "flex items-center justify-center bg-[var(--background)]",
          className ?? "h-12 w-12 rounded-xl text-2xl"
        )}
      >
        {product.emoji}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "overflow-hidden bg-[var(--background)]",
        className ?? "h-12 w-12 rounded-xl"
      )}
    >
      <img
        src={product.image}
        alt={product.name}
        loading={eager ? "eager" : "lazy"}
        onError={() => setFailed(true)}
        className={cn("h-full w-full object-cover", imgClassName)}
      />
    </div>
  );
}
