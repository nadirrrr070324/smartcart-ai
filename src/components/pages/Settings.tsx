import { Moon, Sun, Trash2, RotateCcw, Download, Palette, Zap, Check } from "lucide-react";
import { useApp, RgbIntensity } from "../../context/AppContext";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";
import { Logo } from "../brand/Logo";
import { cn } from "../../utils/cn";

const intensityOptions: { value: RgbIntensity; label: string; hint: string }[] = [
  { value: "vivid", label: "Vivid", hint: "Full spectrum, aurora and glow" },
  { value: "subtle", label: "Subtle", hint: "Muted spectrum for focus" },
  { value: "off", label: "Off", hint: "Single brand colour" },
];

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: () => void;
  label: string;
}) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={onChange}
      className={cn(
        "relative h-6 w-11 shrink-0 rounded-full transition-colors focus-ring",
        checked ? "rgb-fill" : "bg-[var(--border-strong)]"
      )}
    >
      <span
        className={cn(
          "absolute top-0 h-6 w-6 rounded-full bg-white shadow-md transition-transform",
          checked ? "translate-x-5" : "translate-x-0"
        )}
      />
    </button>
  );
}

export function Settings() {
  const {
    isDarkMode,
    toggleDarkMode,
    products,
    setBudget,
    clearSelection,
    rgbIntensity,
    setRgbIntensity,
    reducedMotion,
    setReducedMotion,
  } = useApp();

  const handleExport = () => {
    const data = JSON.stringify({ products, exportedAt: new Date().toISOString() }, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `smartcart-backup-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-[var(--text-primary)] sm:text-3xl">
          Settings
        </h1>
        <p className="mt-1 text-[var(--text-secondary)]">
          Customize your SmartCart experience.
        </p>
      </div>

      {/* Appearance */}
      <Card padding="md" rgbBorderActive rgbBorder>
        <h3 className="mb-4 text-sm font-medium text-[var(--text-primary)]">Appearance</h3>

        <button
          onClick={toggleDarkMode}
          className="flex w-full items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--background)] p-4 text-left transition-colors hover:border-[var(--border-strong)]"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--surface)] text-[var(--text-primary)]">
              {isDarkMode ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
            </div>
            <div className="text-left">
              <p className="font-medium text-[var(--text-primary)]">
                {isDarkMode ? "Dark mode" : "Light mode"}
              </p>
              <p className="text-xs text-[var(--text-muted)]">
                {isDarkMode ? "Switch to light theme" : "Switch to dark theme"}
              </p>
            </div>
          </div>
          <Toggle checked={isDarkMode} onChange={toggleDarkMode} label="Toggle dark mode" />
        </button>
      </Card>

      {/* RGB effects */}
      <Card padding="md" rgbBorderActive rgbBorder className="rgb-surface">
        <div className="mb-4 flex items-center gap-2">
          <Palette className="h-4 w-4 text-[var(--accent)]" />
          <h3 className="text-sm font-medium text-[var(--text-primary)]">RGB effects</h3>
        </div>

        <p className="mb-4 text-xs leading-relaxed text-[var(--text-secondary)]">
          SmartCart&apos;s motion language is driven by a five-stop spectrum. Pick how loud it
          should be — the choice is saved to this browser.
        </p>

        <div className="grid gap-3 sm:grid-cols-3">
          {intensityOptions.map((option) => {
            const isActive = rgbIntensity === option.value;
            return (
              <button
                key={option.value}
                onClick={() => setRgbIntensity(option.value)}
                aria-pressed={isActive}
                className={cn(
                  "relative overflow-hidden rounded-xl border p-4 text-left transition-all duration-200",
                  isActive
                    ? "rgb-border rgb-border-active bg-[var(--surface)]"
                    : "border-[var(--border)] bg-[var(--background)] hover:border-[var(--border-strong)]"
                )}
              >
                {/* Spectrum preview strip */}
                <div className="mb-3 flex gap-1">
                  {["--rgb-1", "--rgb-2", "--rgb-3", "--rgb-4", "--rgb-5"].map((token) => (
                    <span
                      key={token}
                      className="h-2 flex-1 rounded-full"
                      style={{
                        background:
                          option.value === "off"
                            ? "var(--accent)"
                            : `var(${token})`,
                        opacity: option.value === "subtle" ? 0.6 : 1,
                      }}
                    />
                  ))}
                </div>

                <div className="flex items-center justify-between">
                  <span className="font-medium text-[var(--text-primary)]">{option.label}</span>
                  {isActive && (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--accent-subtle)] text-[var(--accent)]">
                      <Check className="h-3 w-3" />
                    </span>
                  )}
                </div>
                <p className="mt-1 text-xs text-[var(--text-muted)]">{option.hint}</p>
              </button>
            );
          })}
        </div>

        <div className="mt-4 flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--background)] text-[var(--accent)]">
              <Zap className="h-5 w-5" />
            </div>
            <div>
              <p className="font-medium text-[var(--text-primary)]">Reduce motion</p>
              <p className="text-xs text-[var(--text-muted)]">
                Freeze all animation, keep the static spectrum
              </p>
            </div>
          </div>
          <Toggle
            checked={reducedMotion}
            onChange={() => setReducedMotion(!reducedMotion)}
            label="Toggle reduced motion"
          />
        </div>
      </Card>

      {/* Data */}
      <Card padding="md" rgbBorder>
        <h3 className="mb-4 text-sm font-medium text-[var(--text-primary)]">Data</h3>
        <div className="space-y-3">
          <Button variant="secondary" className="w-full justify-start" onClick={handleExport}>
            <Download className="h-4 w-4" />
            Export Products
          </Button>
          <Button
            variant="secondary"
            className="w-full justify-start"
            onClick={() => {
              setBudget(1000);
              clearSelection();
            }}
          >
            <RotateCcw className="h-4 w-4" />
            Reset Budget &amp; Selection
          </Button>
          <Button
            variant="danger"
            className="w-full justify-start"
            onClick={() => {
              if (confirm("This will clear all your products. Continue?")) {
                window.location.reload();
              }
            }}
          >
            <Trash2 className="h-4 w-4" />
            Reset All Data
          </Button>
        </div>
      </Card>

      {/* About */}
      <Card padding="md" rgbBorderActive rgbBorder>
        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
          <Logo size={56} markOnly />
          <div className="min-w-0">
            <h3 className="text-sm font-medium text-[var(--text-primary)]">About SmartCart</h3>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              Version 2.0.0 • Built with React, Vite, Tailwind CSS, Recharts &amp; Framer Motion.
            </p>
            <p className="mt-2 text-xs text-[var(--text-muted)]">
              The mark pairs a cart silhouette with a sparkle — the optimizer, plus the
              intelligence behind it.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}