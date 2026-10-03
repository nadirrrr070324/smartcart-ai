import { cn } from "../../utils/cn";

interface ProgressBarProps {
  value: number;
  max?: number;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
  animated?: boolean;
  /** Force the spectrum gradient. Off means the fill tracks status colour. */
  rgb?: boolean;
}

export function ProgressBar({
  value,
  max = 100,
  size = "md",
  showLabel = true,
  className,
  animated = true,
  rgb = true,
}: ProgressBarProps) {
  // The raw ratio drives the status flags; only the rendered width is clamped,
  // so "over budget" stays reachable instead of being capped away.
  const rawPercentage = max <= 0 ? 0 : (value / max) * 100;
  const percentage = Math.min(100, Math.max(0, rawPercentage));
  const isOverBudget = rawPercentage > 100;
  const isWarn = rawPercentage > 90 && !isOverBudget;

  return (
    <div className={cn("w-full", className)}>
      <div
        className={cn(
          "relative w-full overflow-hidden rounded-full bg-[var(--background)]",
          size === "sm" && "h-1.5",
          size === "md" && "h-2.5",
          size === "lg" && "h-4"
        )}
      >
        <div
          className={cn(
            "h-full rounded-full progress-bar",
            rgb && !isOverBudget && !isWarn ? "rgb-fill" : isOverBudget ? "bg-[var(--error)]" : "bg-[var(--warning)]",
            animated && "animate-progress-pulse"
          )}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />

        {/* Travelling highlight so long bars stay alive */}
        {rgb && !isOverBudget && !isWarn && (
          <div
            aria-hidden
            className="rgb-shine pointer-events-none"
            style={{
              position: "absolute",
              inset: "0 0 0 0",
              ["--shine-delay" as string]: "1.1s",
            }}
          />
        )}
      </div>

      {showLabel && (
        <div className="mt-2 flex items-center justify-between text-sm">
          <span className="text-[var(--text-muted)]">
            {isOverBudget ? "Over budget" : `${percentage.toFixed(0)}% used`}
          </span>
          <span className="font-medium text-[var(--text-primary)]">
            {value} / {max}
          </span>
        </div>
      )}
    </div>
  );
}