import { cn } from "../../utils/cn";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "success" | "warning" | "error" | "accent" | "rgb";
  className?: string;
}

export function Badge({ children, variant = "default", className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        variant === "default" && "bg-[var(--background)] text-[var(--text-secondary)]",
        variant === "success" && "bg-[var(--success-subtle)] text-[var(--success)]",
        variant === "warning" && "bg-[var(--warning-subtle)] text-[var(--warning)]",
        variant === "error" && "bg-[var(--error-subtle)] text-[var(--error)]",
        variant === "accent" && "bg-[var(--accent-subtle)] text-[var(--accent)]",
        variant === "rgb" && "rgb-border rgb-border-active bg-[var(--surface)] text-[var(--text-primary)]",
        className
      )}
    >
      {children}
    </span>
  );
}
