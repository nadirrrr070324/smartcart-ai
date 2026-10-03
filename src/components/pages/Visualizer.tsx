import { useState, useEffect, useRef } from "react";
import { Play, Pause, SkipBack, SkipForward, RotateCcw, Grid3X3, Zap } from "lucide-react";
import { useApp } from "../../context/AppContext";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";
import { ProgressBar } from "../ui/ProgressBar";
import { generateDPSteps } from "../../utils/optimization";
import { cn } from "../../utils/cn";

type Speed = "slow" | "normal" | "fast";

const speedMap: Record<Speed, number> = {
  slow: 800,
  normal: 350,
  fast: 80,
};

export function Visualizer() {
  const { products, budget, selectedIds } = useApp();
  const selectedProducts = products.filter((p) => selectedIds.includes(p.id));
  const displayProducts = selectedProducts.length > 0 ? selectedProducts : products.slice(0, 5);

  const roundedBudget = Math.floor(budget / 10) * 10;
  const budgetSteps = Array.from({ length: roundedBudget / 100 + 1 }, (_, i) => i * 100);
  const steps = generateDPSteps(displayProducts, budget);

  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState<Speed>("normal");
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const current = steps[currentStep];

  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        setCurrentStep((prev) => {
          if (prev >= steps.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, speedMap[speed]);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPlaying, speed, steps.length]);

  useEffect(() => {
    setCurrentStep(0);
    setIsPlaying(false);
  }, [selectedIds, budget]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) setCurrentStep((prev) => prev + 1);
  };

  const handlePrev = () => {
    if (currentStep > 0) setCurrentStep((prev) => prev - 1);
  };

  const handleReset = () => {
    setIsPlaying(false);
    setCurrentStep(0);
  };

  const getCellState = (i: number, w: number) => {
    if (i === current.i && w === current.w) return "current";
    if (current.i > 0 && i === current.i - 1 && w === current.w) return "dependency";
    if (current.decision === "include" && i === current.i - 1 && w === current.prevWeight) return "include-dep";
    if (i === displayProducts.length && w === roundedBudget && currentStep === steps.length - 1) return "final";
    if (i < current.i || (i === current.i && w < current.w)) return "computed";
    return "default";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-[var(--text-primary)] sm:text-3xl">
          How the optimizer <span className="rgb-text-soft">thinks</span>
        </h1>
        <p className="mt-1 text-[var(--text-secondary)]">
          Watch Dynamic Programming find the best combination.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Matrix */}
        <div className="lg:col-span-2">
          <Card padding="md" rgbBorderActive rgbBorder className="overflow-hidden">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Grid3X3 className="h-5 w-5 text-[var(--accent)]" />
                <h3 className="font-medium text-[var(--text-primary)]">DP Matrix</h3>
              </div>
              <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
                <span className="flex items-center gap-1">
                  <span className="rgb-fill h-2 w-2 rounded-full" /> Current
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-[var(--warning)]" /> Dependency
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-[var(--success)]" /> Final
                </span>
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--border)] bg-[var(--background)]">
                    <th className="sticky left-0 z-10 min-w-[120px] border-r border-[var(--border)] bg-[var(--background)] px-3 py-2 text-left text-xs font-medium text-[var(--text-muted)]">
                      Product
                    </th>
                    {budgetSteps.map((w) => (
                      <th
                        key={w}
                        className="min-w-[52px] px-2 py-2 text-center text-xs font-medium text-[var(--text-muted)]"
                      >
                        ₹{w}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-[var(--border)]">
                    <td className="sticky left-0 z-10 border-r border-[var(--border)] bg-[var(--background)] px-3 py-2.5 text-xs font-medium text-[var(--text-secondary)]">
                      None
                    </td>
                    {budgetSteps.map((w) => {
                      const state = getCellState(0, w);
                      return (
                        <td key={w} className={cellClass(state)}>
                          0
                        </td>
                      );
                    })}
                  </tr>
                  {displayProducts.map((product, idx) => (
                    <tr key={product.id} className="border-b border-[var(--border)] last:border-b-0">
                      <td className="sticky left-0 z-10 border-r border-[var(--border)] bg-[var(--background)] px-3 py-2.5 text-xs font-medium text-[var(--text-secondary)]">
                        <span className="mr-1">{product.emoji}</span>
                        {product.name}
                      </td>
                      {budgetSteps.map((w) => {
                        const state = getCellState(idx + 1, w);
                        const value = computeCellValue(displayProducts, idx + 1, w);
                        return (
                          <td key={w} className={cellClass(state)}>
                            {state === "default" ? "—" : value}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Controls */}
            <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <Button variant="secondary" size="sm" onClick={handlePrev} disabled={currentStep === 0}>
                  <SkipBack className="h-4 w-4" />
                </Button>
                <Button variant={isPlaying ? "secondary" : "primary"} size="sm" onClick={() => setIsPlaying(!isPlaying)}>
                  {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  {isPlaying ? "Pause" : "Run"}
                </Button>
                <Button variant="secondary" size="sm" onClick={handleNext} disabled={currentStep === steps.length - 1}>
                  <SkipForward className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={handleReset}>
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-[var(--text-muted)]">Speed</span>
                {(["slow", "normal", "fast"] as Speed[]).map((s) => (
                  <button
                    key={s}
                    onClick={() => setSpeed(s)}
                    className={cn(
                      "rounded-lg px-2.5 py-1 text-xs font-medium capitalize transition-colors",
                      speed === s
                        ? "bg-[var(--accent-subtle)] text-[var(--accent)]"
                        : "text-[var(--text-muted)] hover:bg-[var(--background)]"
                    )}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-4">
              <ProgressBar
                value={currentStep + 1}
                max={steps.length}
                size="sm"
                showLabel={false}
                animated={false}
              />
              <p className="mt-1 text-right text-xs text-[var(--text-muted)]">
                Step {currentStep + 1} of {steps.length}
              </p>
            </div>
          </Card>
        </div>

        {/* Explanation Panel */}
        <div className="lg:col-span-1">
          <div className="sticky top-6 space-y-4">
            <Card padding="md" rgbBorderActive rgbBorder className="rgb-surface">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-[var(--accent)]" />
                <h3 className="text-sm font-medium text-[var(--text-primary)]">Current decision</h3>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-[var(--text-secondary)]">
                {current.explanation}
              </p>
              {current.product && (
                <div className="mt-4 rounded-xl bg-[var(--surface)] p-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--text-muted)]">Product</span>
                    <span className="font-medium text-[var(--text-primary)]">
                      {current.product.emoji} {current.product.name}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-[var(--text-muted)]">Price</span>
                    <span className="font-medium text-[var(--text-primary)]">
                      ₹{current.product.price}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-[var(--text-muted)]">Utility</span>
                    <span className="font-medium text-[var(--success)]">
                      +{current.product.utility}
                    </span>
                  </div>
                </div>
              )}
            </Card>

            <Card padding="md">
              <h3 className="mb-3 text-sm font-medium text-[var(--text-primary)]">Decision breakdown</h3>
              <div className="space-y-3">
                <DecisionRow
                  label="Exclude"
                  value={current.exclude}
                  active={current.decision === "exclude" || current.decision === "skip"}
                />
                <DecisionRow
                  label="Include"
                  value={current.include}
                  active={current.decision === "include"}
                />
                <div className="h-px bg-[var(--border)]" />
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[var(--text-secondary)]">Chosen value</span>
                  <span className="font-display rgb-text-soft text-lg font-bold">{current.value}</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

function computeCellValue(products: ReturnType<typeof useApp>["products"], i: number, w: number): number {
  const dp: number[][] = Array.from({ length: i + 1 }, () => Array(w + 1).fill(0));
  for (let row = 1; row <= i; row++) {
    const product = products[row - 1];
    for (let col = 0; col <= w; col++) {
      const exclude = dp[row - 1][col];
      let include = 0;
      if (product && product.price <= col) {
        include = product.utility + dp[row - 1][col - product.price];
      }
      dp[row][col] = Math.max(exclude, include);
    }
  }
  return dp[i][w];
}

function cellClass(state: string) {
  return cn(
    "px-2 py-2.5 text-center text-xs font-medium transition-colors duration-300",
    state === "current" && "rgb-fill text-white shadow-[0_0_14px_-2px_var(--rgb-2)]",
    state === "dependency" && "bg-[var(--warning-subtle)] text-[var(--warning)]",
    state === "include-dep" && "bg-[var(--success-subtle)] text-[var(--success)]",
    state === "final" && "rgb-fill text-white animate-pulse-subtle shadow-[0_0_18px_-2px_var(--rgb-4)]",
    state === "computed" && "bg-[var(--background)] text-[var(--text-primary)]",
    state === "default" && "text-[var(--text-muted)]"
  );
}

function DecisionRow({
  label,
  value,
  active,
}: {
  label: string;
  value: number;
  active: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between rounded-xl px-3 py-2.5 transition-colors",
        active ? "bg-[var(--accent-subtle)]" : "bg-[var(--background)]"
      )}
    >
      <span className={cn("text-sm", active ? "text-[var(--accent)]" : "text-[var(--text-secondary)]")}>
        {label}
      </span>
      <span
        className={cn(
          "font-display font-semibold",
          active ? "rgb-text-soft" : "text-[var(--text-primary)]"
        )}
      >
        {value}
      </span>
    </div>
  );
}
