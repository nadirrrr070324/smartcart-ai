import { ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "../../utils/cn";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "outline";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  /** Diffuse spectrum bloom behind the button. */
  glow?: boolean;
  /** Sweeping specular highlight across the button face. */
  shine?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant = "primary", size = "md", isLoading, glow = false, shine, children, disabled, ...props },
    ref
  ) => {
    const showShine = shine ?? variant === "primary";

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all duration-200 focus-ring btn-press disabled:opacity-50 disabled:cursor-not-allowed",
          glow && "rgb-glow",
          showShine && variant === "primary" && "rgb-shine overflow-hidden",
          size === "sm" && "h-8 px-3 text-sm",
          size === "md" && "h-10 px-4 text-sm",
          size === "lg" && "h-12 px-6 text-base",
          variant === "primary" &&
            "rgb-fill text-white shadow-sm hover:shadow-lg hover:brightness-110",
          variant === "secondary" &&
            "bg-[var(--surface-elevated)] text-[var(--text-primary)] border border-[var(--border)] hover:border-[var(--border-strong)] hover:bg-[var(--background)]",
          variant === "outline" &&
            "rgb-border bg-transparent text-[var(--text-primary)] border border-[var(--border)] hover:border-transparent hover:text-[var(--accent)]",
          variant === "ghost" &&
            "bg-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-elevated)]",
          variant === "danger" &&
            "bg-[var(--error-subtle)] text-[var(--error)] hover:bg-[var(--error)] hover:text-white",
          className
        )}
        {...props}
      >
        {isLoading ? (
          <>
            <svg
              className="animate-spin h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span>Loading...</span>
          </>
        ) : (
          children
        )}
      </button>
    );
  }
);

Button.displayName = "Button";