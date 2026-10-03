import { useEffect } from "react";
import { motion } from "framer-motion";
import { Sparkles, TrendingUp, Wallet, Package, IndianRupee, Calculator, RefreshCw, TrendingDown, Activity } from "lucide-react";
import { useApp } from "../../context/AppContext";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";
import { ProgressBar } from "../ui/ProgressBar";
import { formatCurrency } from "../../utils/optimization";
import { BudgetUsageChart } from "../charts/BudgetUsageChart";
import { ProductImage } from "../ui/ProductImage";
import { cn } from "../../utils/cn";

export function Dashboard() {
  const {
    budget,
    setBudget,
    selectedIds,
    products,
    optimizationResult,
    runOptimization,
    setPage,
    realTimeMarketData,
    refreshMarketData,
    getMarketAnalysis,
  } = useApp();

  const selectedProducts = products.filter((p) => selectedIds.includes(p.id));
  const totalCost = selectedProducts.reduce((sum, p) => sum + p.price, 0);
  const totalUtility = selectedProducts.reduce((sum, p) => sum + p.utility, 0);
  const remaining = Math.max(0, budget - totalCost);
  const usedPercent = Math.min(100, (totalCost / budget) * 100);

  useEffect(() => {
    if (selectedIds.length > 0) {
      runOptimization();
    }
  }, [selectedIds, budget]);

  const metrics = [
    {
      label: "Maximum Utility",
      value: optimizationResult ? optimizationResult.totalUtility : totalUtility,
      icon: TrendingUp,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
    },
    {
      label: "Total Cost",
      value: formatCurrency(optimizationResult ? optimizationResult.totalCost : totalCost),
      icon: Wallet,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
    },
    {
      label: "Remaining",
      value: formatCurrency(optimizationResult ? optimizationResult.remainingBudget : remaining),
      icon: IndianRupee,
      color: "text-amber-500",
      bg: "bg-amber-500/10",
    },
    {
      label: "Products Selected",
      value: `${selectedIds.length} / ${products.length}`,
      icon: Package,
      color: "text-violet-500",
      bg: "bg-violet-500/10",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1">
            <span className="rgb-fill rgb-beacon h-1.5 w-1.5 rounded-full" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">
              Live optimizer
            </span>
          </div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-[var(--text-primary)] sm:text-3xl">
            Build your <span className="rgb-text-soft">smartest</span> cart.
          </h1>
          <p className="mt-1 text-[var(--text-secondary)]">
            Maximize shopping utility without exceeding your budget.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={refreshMarketData} className="self-start sm:self-auto">
            <RefreshCw className="h-4 w-4" />
            Refresh Market Data
          </Button>
          <Button onClick={() => setPage("optimizer")} glow className="self-start sm:self-auto">
            <Sparkles className="h-4 w-4" />
            Open Optimizer
          </Button>
        </div>
      </div>

      {/* Market Indices Ticker */}
      {realTimeMarketData && realTimeMarketData.marketIndices.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)]"
        >
          <div className="flex items-center gap-6 overflow-x-auto px-4 py-3">
            <span className="shrink-0 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
              Market Indices
            </span>
            {realTimeMarketData.marketIndices.map((index) => (
              <div key={index.name} className="flex shrink-0 items-center gap-2">
                <span className="text-sm font-medium text-[var(--text-primary)]">{index.name}</span>
                <span className="text-sm text-[var(--text-secondary)]">{index.value.toLocaleString()}</span>
                <span
                  className={cn(
                    "text-xs font-semibold",
                    index.changePercent >= 0 ? "text-[var(--success)]" : "text-[var(--error)]"
                  )}
                >
                  {index.changePercent >= 0 ? "+" : ""}
                  {index.changePercent.toFixed(2)}%
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Budget Card */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Card className="rgb-border rgb-border-active relative overflow-hidden" padding="lg">
          <div className="rgb-surface absolute inset-0" />
          <div className="relative">
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-[var(--text-secondary)]">
                  Shopping Budget
                </label>
                <div className="flex items-center gap-2">
                  <span className="font-display text-3xl font-bold text-[var(--text-primary)] sm:text-4xl">
                    {formatCurrency(budget)}
                  </span>
                  <button
                    onClick={() => {
                      const newBudget = prompt("Enter new budget:", budget.toString());
                      if (newBudget && !isNaN(Number(newBudget))) {
                        setBudget(Math.max(0, Number(newBudget)));
                      }
                    }}
                    aria-label="Set budget manually"
                    className="rounded-lg p-1.5 text-[var(--text-muted)] hover:bg-[var(--background)] hover:text-[var(--text-primary)]"
                  >
                    <Calculator className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <input
                type="range"
                min="500"
                max="10000"
                step="100"
                aria-label="Shopping budget"
                value={budget}
                onChange={(e) => setBudget(Number(e.target.value))}
                className="w-full sm:w-64 accent-[var(--accent)]"
              />
            </div>
            <ProgressBar
              value={optimizationResult ? optimizationResult.totalCost : totalCost}
              max={budget}
              size="lg"
              showLabel
            />
          </div>
        </Card>
      </motion.div>

      {/* Metrics Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric, index) => {
          const Icon = metric.icon;
          return (
            <motion.div
              key={metric.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 + index * 0.05 }}
            >
              <Card padding="md" hover rgbBorder>
                <div className="flex items-start justify-between">
                  <div className="min-w-0">
                    <p className="text-sm text-[var(--text-secondary)]">{metric.label}</p>
                    <p className="font-display mt-1.5 text-2xl font-bold text-[var(--text-primary)]">
                      {metric.value}
                    </p>
                  </div>
                  <div className={cn("rounded-xl p-2", metric.bg, metric.color)}>
                    <Icon className="h-5 w-5" />
                  </div>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Analytics Preview */}
      <div className="grid gap-6 lg:grid-cols-3">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.35 }}
          className="lg:col-span-1"
        >
          <Card padding="md" hover rgbBorder className="h-full">
            <h3 className="mb-4 text-sm font-medium text-[var(--text-primary)]">Budget Usage</h3>
            <div className="flex flex-col items-center justify-center py-4">
              <BudgetUsageChart value={usedPercent} />
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
          className="lg:col-span-2"
        >
          <Card padding="md" hover rgbBorder className="h-full">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-medium text-[var(--text-primary)]">Selected Products</h3>
              <Button variant="ghost" size="sm" onClick={() => setPage("optimizer")}>
                View all
              </Button>
            </div>
            {selectedProducts.length === 0 ? (
              <div className="flex h-40 flex-col items-center justify-center rounded-xl border border-dashed border-[var(--border-strong)] bg-[var(--background)] text-center">
                <p className="text-sm text-[var(--text-muted)]">No products selected yet.</p>
                <Button variant="ghost" size="sm" onClick={() => setPage("optimizer")} className="mt-2">
                  Open Optimizer
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {selectedProducts.slice(0, 4).map((product) => {
                  const marketAnalysis = getMarketAnalysis(product.id);
                  return (
                    <div
                      key={product.id}
                      className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 py-3"
                    >
                      <div className="flex items-center gap-3">
                        <ProductImage product={product} className="h-10 w-10 rounded-lg text-xl" />
                        <div>
                          <span className="text-sm font-medium text-[var(--text-primary)]">
                            {product.name}
                          </span>
                          {marketAnalysis && (
                            <div className="flex items-center gap-2 mt-1">
                              {marketAnalysis.price.discount > 0 && (
                                <span className="text-xs text-[var(--success)] font-semibold">
                                  -{marketAnalysis.price.discount}% OFF
                                </span>
                              )}
                              {marketAnalysis.trend.trend === "rising" && (
                                <span className="text-xs text-[var(--warning)] flex items-center gap-1">
                                  <TrendingUp className="h-3 w-3" />
                                  Price rising
                                </span>
                              )}
                              {marketAnalysis.trend.trend === "falling" && (
                                <span className="text-xs text-[var(--success)] flex items-center gap-1">
                                  <TrendingDown className="h-3 w-3" />
                                  Price dropping
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-[var(--text-secondary)]">{formatCurrency(product.price)}</span>
                        <span className="text-[var(--success)]">+{product.utility}</span>
                      </div>
                    </div>
                  );
                })}
                {selectedProducts.length > 4 && (
                  <p className="text-center text-xs text-[var(--text-muted)]">
                    +{selectedProducts.length - 4} more products
                  </p>
                )}
              </div>
            )}
          </Card>
        </motion.div>
      </div>

      {/* Market Signals */}
      {realTimeMarketData && realTimeMarketData.tradingSignals.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.5 }}
        >
          <Card padding="md" hover rgbBorder>
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-[var(--accent)]" />
                <h3 className="text-sm font-medium text-[var(--text-primary)]">Market Signals</h3>
              </div>
              <span className="text-xs text-[var(--text-muted)]">
                Last updated: {realTimeMarketData.timestamp.toLocaleTimeString()}
              </span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {realTimeMarketData.tradingSignals.slice(0, 4).map((signal) => {
                const product = products.find((p) => p.id === signal.productId);
                if (!product) return null;
                const signalColor =
                  signal.signal === "strong_buy" || signal.signal === "buy"
                    ? "text-[var(--success)]"
                    : signal.signal === "sell" || signal.signal === "strong_sell"
                    ? "text-[var(--error)]"
                    : "text-[var(--warning)]";
                const bgColor =
                  signal.signal === "strong_buy" || signal.signal === "buy"
                    ? "bg-[var(--success-subtle)]"
                    : signal.signal === "sell" || signal.signal === "strong_sell"
                    ? "bg-[var(--error-subtle)]"
                    : "bg-[var(--warning-subtle)]";
                return (
                  <div
                    key={signal.productId}
                    className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-3"
                  >
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <ProductImage product={product} className="h-12 w-12 rounded-xl text-2xl" />
                      <span className={cn("text-xs font-semibold uppercase", signalColor, bgColor, "px-2 py-1 rounded-full")}>
                        {signal.signal.replace("_", " ")}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-[var(--text-primary)]">{product.name}</p>
                    <p className="text-xs text-[var(--text-muted)] mt-1">{signal.reason}</p>
                    <div className="mt-2 flex items-center gap-2 text-xs">
                      <span className="text-[var(--text-secondary)]">Strength:</span>
                      <span className="font-semibold text-[var(--text-primary)]">{signal.strength}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </motion.div>
      )}
    </div>
  );
}


