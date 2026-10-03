import { HTMLAttributes, forwardRef } from "react";
import { cn } from "../../utils/cn";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
  padding?: "none" | "sm" | "md" | "lg";
  /** Paint a spectrum rim that appears on hover. */
  rgbBorder?: boolean;
  /** Keep the rim visible at rest. */
  rgbBorderActive?: boolean;
  /** Translucent spectrum wash behind the content. */
  rgbSurface?: boolean;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    {
      className,
      hover = true,
      padding = "md",
      rgbBorder = false,
      rgbBorderActive = false,
      rgbSurface = false,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={cn(
          "bg-[var(--surface)] rounded-2xl border border-[var(--border)] shadow-sm",
          hover && "card-hover",
          rgbBorder && "rgb-border",
          rgbBorderActive && "rgb-border-active",
          rgbSurface && "rgb-surface",
          padding === "none" && "",
          padding === "sm" && "p-4",
          padding === "md" && "p-5",
          padding === "lg" && "p-6",
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = "Card";