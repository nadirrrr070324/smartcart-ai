import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  SlidersHorizontal,
  Check,
  Sparkles,
  ShoppingBag,
  IndianRupee,
  TrendingUp,
  Wallet,
  RotateCcw,
  Save,
  Target,
  Shield,
  Zap,
  ArrowRight,
} from "lucide-react";
import { useApp } from "../../context/AppContext";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Modal } from "../ui/Modal";
import { Badge } from "../ui/Badge";
import { ProgressBar } from "../ui/ProgressBar";
import { EmptyState } from "../ui/EmptyState";
import { formatCurrency, formatRatio } from "../../utils/optimization";
import { ProductImage } from "../ui/ProductImage";
import { cn } from "../../utils/cn";
import { Product, SortOption } from "../../types";

const sortOptions: { value: SortOption; label: string }[] = [
  { value: "name", label: "Name" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "utility-desc", label: "Utility: High to Low" },
  { value: "ratio-desc", label: "Best Value" },
];

export function Optimizer() {
  const {
    budget,
    setBudget,
    filteredProducts,
    selectedIds,
    toggleSelection,
    selectAll,
    clearSelection,
    optimizationResult,
    runOptimization,
    saveScenario,
    searchQuery,
    setSearchQuery,
    sortOption,
    setSortOption,
    availableProducts,
    availableStrategies,
    selectedStrategy,
    setSelectedStrategy,
    applyMarketStrategy,
    getMarketAnalysis,
  } = useApp();

  const [showResults, setShowResults] = useState(false);
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [scenarioName, setScenarioName] = useState("");

  const selectedProducts = filteredProducts.filter((p) => selectedIds.includes(p.id));
  const totalCost = selectedProducts.reduce((sum, p) => sum + p.price, 0);
  const totalUtility = selectedProducts.reduce((sum, p) => sum + p.utility, 0);
  const remaining = Math.max(0, budget - totalCost);

  useEffect(() => {
    setShowResults(false);
  }, [selectedIds, budget]);

  const handleOptimize = () => {
    runOptimization();
    setShowResults(true);
  };

  const handleSaveScenario = () => {
    if (scenarioName.trim()) {
      saveScenario(scenarioName);
      setScenarioName("");
      setSaveModalOpen(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-[var(--text-primary)] sm:text-3xl">
            <span className="rgb-text-soft">Optimizer</span>
          </h1>
          <p className="mt-1 text-[var(--text-secondary)]">
            Select products and let AI build your optimal cart.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={clearSelection}>
            <RotateCcw className="h-4 w-4" />
            Reset
          </Button>
          <Button variant="secondary" size="sm" onClick={() => setSaveModalOpen(true)}>
            <Save className="h-4 w-4" />
            Save
          </Button>
        </div>
      </div>

      {/* Trading Strategy Selection */}
      <Card padding="md" rgbBorder rgbBorderActive>
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-[var(--accent)]" />
            <h3 className="text-sm font-medium text-[var(--text-primary)]">Market Strategy</h3>
          </div>
          {selectedStrategy && (
            <Button variant="ghost" size="sm" onClick={() => setSelectedStrategy(null)}>
              Clear Strategy
            </Button>
          )}
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          {availableStrategies.map((strategy) => {
            const Icon =
              strategy.type === "conservative"
                ? Shield
                : strategy.type === "balanced"
                ? Target
                : Zap;
            const isSelected = selectedStrategy?.id === strategy.id;
            return (
              <button
                key={strategy.id}
                onClick={() => setSelectedStrategy(strategy)}
                className={cn(
                  "rounded-xl border p-4 text-left transition-all",
                  isSelected
                    ? "rgb-border rgb-border-active border-[var(--accent)] bg-[var(--accent-subtle)]"
                    : "border-[var(--border)] bg-[var(--background)] hover:border-[var(--border-strong)]"
                )}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Icon
                    className={cn(
                      "h-5 w-5",
                      isSelected ? "text-[var(--accent)]" : "text-[var(--text-muted)]"
                    )}
                  />
                  <span
                    className={cn(
                      "font-semibold",
                      isSelected ? "text-[var(--text-primary)]" : "text-[var(--text-secondary)]"
                    )}
                  >
                    {strategy.name}
                  </span>
                </div>
                <p className="text-xs text-[var(--text-muted)] mb-3">{strategy.description}</p>
                <div className="flex items-center gap-3 text-xs">
                  <div>
                    <span className="text-[var(--text-muted)]">Risk:</span>
                    <span className="ml-1 font-semibold text-[var(--text-primary)]">
                      {strategy.riskTolerance}%
                    </span>
                  </div>
                  <div>
                    <span className="text-[var(--text-muted)]">Target:</span>
                    <span className="ml-1 font-semibold text-[var(--success)]">
                      {strategy.targetReturn}%
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
        {selectedStrategy && (
          <div className="mt-4 flex justify-end">
            <Button onClick={applyMarketStrategy} size="sm">
              <ArrowRight className="h-4 w-4" />
              Apply {selectedStrategy.name} Strategy
            </Button>
          </div>
        )}
      </Card>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Left: Product Selection */}
        <div className="lg:col-span-3 space-y-4">
          <Card padding="sm" hover={false} className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] py-2.5 pl-9 pr-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus-ring focus:border-[var(--accent)]"
              />
            </div>
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4 text-[var(--text-muted)]" />
              <select
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value as SortOption)}
                className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm text-[var(--text-primary)] focus-ring focus:border-[var(--accent)]"
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <Button variant="outline" size="sm" onClick={selectAll}>
              Select All
            </Button>
          </Card>

          {filteredProducts.length === 0 ? (
            <EmptyState
              icon={<ShoppingBag className="h-8 w-8 text-[var(--text-muted)]" />}
              title="No products found"
              description="Try adjusting your search or add a new product."
            />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              <AnimatePresence mode="popLayout">
                {filteredProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    isSelected={selectedIds.includes(product.id)}
                    isAvailable={availableProducts.some((p) => p.id === product.id)}
                    onToggle={() => toggleSelection(product.id)}
                    getMarketAnalysis={getMarketAnalysis}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Right: Optimized Cart Summary */}
        <div className="lg:col-span-2">
          <div className="sticky top-6 space-y-4">
            <Card padding="md" rgbBorderActive rgbBorder className="rgb-surface">
              <h3 className="text-sm font-medium text-[var(--text-primary)]">Shopping Budget</h3>
              <div className="mt-2 flex items-center gap-2">
                <IndianRupee className="h-5 w-5 text-[var(--accent)]" />
                <input
                  type="number"
                  aria-label="Shopping budget"
                  value={budget}
                  onChange={(e) => setBudget(Math.max(0, Number(e.target.value)))}
                  className="font-display w-full bg-transparent text-3xl font-bold text-[var(--text-primary)] focus:outline-none"
                />
              </div>
              <div className="mt-4">
                <ProgressBar value={totalCost} max={budget} size="md" showLabel={false} />
              </div>
            </Card>

            <Card padding="md" rgbBorder>
              <h3 className="mb-4 text-sm font-medium text-[var(--text-primary)]">Optimized Cart</h3>
              <div className="space-y-3">
                <SummaryRow
                  icon={Wallet}
                  label="Total"
                  value={`${formatCurrency(totalCost)} / ${formatCurrency(budget)}`}
                  color="text-blue-500"
                />
                <SummaryRow
                  icon={TrendingUp}
                  label="Utility"
                  value={totalUtility.toString()}
                  color="text-emerald-500"
                />
                <SummaryRow
                  icon={IndianRupee}
                  label="Remaining"
                  value={formatCurrency(remaining)}
                  color="text-amber-500"
                />
              </div>

              <div className="my-4 h-px bg-[var(--border)]" />

              <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
                {selectedProducts.length === 0 ? (
                  <p className="py-4 text-center text-sm text-[var(--text-muted)]">
                    No products selected
                  </p>
                ) : (
                  selectedProducts.map((product) => (
                    <div
                      key={product.id}
                      className="flex items-center justify-between rounded-xl bg-[var(--background)] px-3 py-2"
                    >
                      <div className="flex items-center gap-2">
                        <ProductImage product={product} className="h-8 w-8 rounded-lg text-base" />
                        <span className="text-sm font-medium text-[var(--text-primary)]">
                          {product.name}
                        </span>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-[var(--text-primary)]">
                          {formatCurrency(product.price)}
                        </p>
                        <p className="text-xs text-[var(--success)]">+{product.utility}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <Button
                onClick={handleOptimize}
                disabled={selectedIds.length === 0}
                className="mt-4 w-full"
                glow
                size="lg"
              >
                <Sparkles className="h-4 w-4" />
                Optimize Cart
              </Button>
            </Card>
          </div>
        </div>
      </div>

      {/* Results Modal */}
      <AnimatePresence>
        {showResults && optimizationResult && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setShowResults(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="rgb-border rgb-border-active relative z-10 w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-[var(--surface)] p-6 shadow-2xl border border-[var(--border)]"
            >
              <div className="mb-6 text-center">
                <div className="rgb-ring mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--success-subtle)] text-[var(--success)]">
                  <Check className="h-8 w-8" />
                </div>
                <h2 className="font-display text-2xl font-bold text-[var(--text-primary)]">
                  Your optimized cart
                </h2>
                <p className="mt-1 text-[var(--text-secondary)]">
                  SmartCart found the best combination for your budget.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <ResultMetric label="Total spend" value={formatCurrency(optimizationResult.totalCost)} />
                <ResultMetric label="Maximum utility" value={optimizationResult.totalUtility.toString()} />
                <ResultMetric label="Budget remaining" value={formatCurrency(optimizationResult.remainingBudget)} />
              </div>

              <div className="mt-6">
                <h3 className="mb-3 text-sm font-medium text-[var(--text-primary)]">Selected Products</h3>
                <div className="space-y-2">
                  {optimizationResult.selectedProducts.map((product) => (
                    <motion.div
                      key={product.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 py-3"
                    >
                      <div className="flex items-center gap-3">
                        <ProductImage product={product} className="h-9 w-9 rounded-lg text-lg" />
                        <span className="font-medium text-[var(--text-primary)]">{product.name}</span>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-[var(--text-secondary)]">{formatCurrency(product.price)}</span>
                        <Badge variant="success">Utility {product.utility}</Badge>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <Button
                  variant="secondary"
                  className="flex-1"
                  onClick={() => setShowResults(false)}
                >
                  Close
                </Button>
                <Button
                  className="flex-1"
                  onClick={() => {
                    setShowResults(false);
                    setSaveModalOpen(true);
                  }}
                >
                  <Save className="h-4 w-4" />
                  Save Scenario
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Save Scenario Modal */}
      <Modal
        isOpen={saveModalOpen}
        onClose={() => setSaveModalOpen(false)}
        title="Save scenario"
        description="Save this cart configuration for later."
      >
        <div className="space-y-4">
          <Input
            label="Scenario name"
            value={scenarioName}
            onChange={(e) => setScenarioName(e.target.value)}
            placeholder="e.g. Weekend Electronics"
          />
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setSaveModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveScenario} disabled={!scenarioName.trim()}>
              <Save className="h-4 w-4" />
              Save Scenario
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function ProductCard({
  product,
  isSelected,
  isAvailable,
  onToggle,
  getMarketAnalysis,
}: {
  product: Product;
  isSelected: boolean;
  isAvailable: boolean;
  onToggle: () => void;
  getMarketAnalysis: (id: string) => any;
}) {
  const marketAnalysis = getMarketAnalysis(product.id);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      onClick={onToggle}
      className={cn(
        "cursor-pointer rounded-2xl border bg-[var(--surface)] p-4 shadow-sm transition-all duration-200",
        isSelected
          ? "rgb-border rgb-border-active ring-1 ring-[var(--accent)]"
          : "border-[var(--border)] hover:border-[var(--border-strong)] hover:shadow-md",
        !isAvailable && !isSelected && "opacity-60"
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <ProductImage product={product} className="h-14 w-14 rounded-xl text-2xl" />
          <div>
            <h3 className="font-medium text-[var(--text-primary)]">{product.name}</h3>
            <p className="text-xs text-[var(--text-muted)]">{product.category}</p>
          </div>
        </div>
        <div
          className={cn(
            "flex h-6 w-6 items-center justify-center rounded-full border-2 transition-colors",
            isSelected ? "rgb-fill border-transparent text-white" : "border-[var(--border-strong)]"
          )}
        >
          {isSelected && <Check className="h-3.5 w-3.5" />}
        </div>
      </div>

      {/* Market Badges */}
      {marketAnalysis && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {marketAnalysis.price.discount > 0 && (
            <Badge variant="success" className="text-xs">
              -{marketAnalysis.price.discount}% OFF
            </Badge>
          )}
          {marketAnalysis.recommendation === "buy" && (
            <Badge variant="accent" className="text-xs">
              BUY
            </Badge>
          )}
          {marketAnalysis.trend.trend === "rising" && (
            <Badge variant="warning" className="text-xs">
              RISING
            </Badge>
          )}
        </div>
      )}

      <div className="mt-4 flex items-center justify-between">
        <div className="flex gap-3 text-sm">
          <span className="text-[var(--text-primary)]">{formatCurrency(product.price)}</span>
          <span className="text-[var(--success)]">Utility {product.utility}</span>
        </div>
        <Badge variant={isSelected ? "accent" : "default"}>{formatRatio(product.utility, product.price)} / ₹</Badge>
      </div>
    </motion.div>
  );
}

function SummaryRow({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl bg-[var(--background)] px-3 py-2.5">
      <div className="flex items-center gap-2 text-[var(--text-secondary)]">
        <Icon className={cn("h-4 w-4", color)} />
        <span className="text-sm">{label}</span>
      </div>
      <span className="text-sm font-semibold text-[var(--text-primary)]">{value}</span>
    </div>
  );
}

function ResultMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rgb-border rgb-border-active rounded-2xl border border-[var(--border)] bg-[var(--background)] p-4 text-center">
      <p className="font-display rgb-text-soft text-2xl font-bold">{value}</p>
      <p className="mt-1 text-xs text-[var(--text-muted)]">{label}</p>
    </div>
  );
}
