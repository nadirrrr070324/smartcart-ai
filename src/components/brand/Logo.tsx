import { cn } from "../../utils/cn";
import logoSrc from "../../assets/logo.png";

interface LogoMarkProps {
  size?: number;
  className?: string;
}

interface LogoProps {
  size?: number;
  className?: string;
  /** Hide the wordmark and render only the mark. */
  markOnly?: boolean;
  /** Tighter wordmark for space-constrained headers. */
  compact?: boolean;
  /** Spectrum-gradient the "AI" half of the wordmark. */
  gradientText?: boolean;
}

/**
 * SmartCart mark, rendered from the brand raster (192x192, rendered at 2x for
 * the largest placement). Kept as an <img> rather than inlined SVG so the
 * artwork stays the single source of truth.
 */
export function LogoMark({ size = 40, className }: LogoMarkProps) {
  return (
    <img
      src={logoSrc}
      alt="SmartCart AI logo"
      width={size}
      height={size}
      draggable={false}
      className={cn("shrink-0 rounded-[14px] object-contain", className)}
      style={{ width: size, height: size }}
    />
  );
}

export function Logo({
  size = 40,
  className,
  markOnly = false,
  compact = false,
  gradientText = true,
}: LogoProps) {
  if (markOnly) {
    return <LogoMark size={size} className={className} />;
  }

  return (
    <span className={cn("inline-flex min-w-0 items-center gap-2.5", className)}>
      <LogoMark size={size} />
      <span className="flex min-w-0 flex-col leading-none">
        <span
          className={cn(
            "font-display truncate font-bold tracking-tight",
            compact ? "text-sm" : "text-[15px]"
          )}
        >
          <span className="text-[var(--text-primary)]">SmartCart</span>{" "}
          <span className={gradientText ? "rgb-text-soft" : "text-[var(--accent)]"}>AI</span>
        </span>
        {!compact && (
          <span className="mt-1 truncate text-[9px] font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">
            Cart Optimizer
          </span>
        )}
      </span>
    </span>
  );
}