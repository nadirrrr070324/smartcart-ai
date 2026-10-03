import { useState } from "react";
import { motion } from "framer-motion";
import {
  TrendingUp,
  TrendingDown,
  Activity,
  RefreshCw,
  Target,
  Shield,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  BarChart3,
  LineChart,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";
import { useApp } from "../../context/AppContext";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";
import { formatCurrency } from "../../utils/optimization";
import { ProductImage } from "../ui/ProductImage";
import { cn } from "../../utils/cn";

export function MarketStrategy() {
  const {
    realTimeMarketData,
    refreshMarketData,
    availableStrategies,
    selectedStrategy,
    setSelectedStrategy,
    applyMarketStrategy,
    products,
    getMarketAnalysis,
  } = useApp();

  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshMarketData();
    setIsRefreshing(false);
  };

  const getSignalIcon = (signal: string) => {
    switch (signal) {
      case "strong_buy":
      case "buy":
        return <ArrowUpRight className="h-4 w-4" />;
      case "strong_sell":
      case "sell":
        return <ArrowDownRight className="h-4 w-4" />;
      default:
        return <Minus className="h-4 w-4" />;
    }
  };

  const getSignalColor = (signal: string) => {
    switch (signal) {
      case "strong_buy":
      case "buy":
        return "text-[var(--success)] bg-[var(--success-subtle)]";
      case "strong_sell":
      case "sell":
        return "text-[var(--error)] bg-[var(--error-subtle)]";
      default:
        return "text-[var(--warning)] bg-[var(--warning-subtle)]";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-[var(--text-primary)] sm:text-3xl">
            Market <span className="rgb-text-soft">Strategy</span>
          </h1>
          <p className="mt-1 text-[var(--text-secondary)]">
            Real-time market data and trading strategies for smart shopping decisions.
          </p>
        </div>
        <Button
          onClick={handleRefresh}
          disabled={isRefreshing}
          variant="secondary"
          className="self-start sm:self-auto"
        >
          <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
          {isRefreshing ? "Refreshing..." : "Refresh Data"}
        </Button>
      </div>

      {/* Market Indices */}
      {realTimeMarketData && realTimeMarketData.marketIndices.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card padding="md" rgbBorderActive rgbBorder>
            <div className="mb-4 flex items-center gap-2">
              <Activity className="h-5 w-5 text-[var(--accent)]" />
              <h3 className="text-sm font-medium text-[var(--text-primary)]">Market Indices</h3>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              {realTimeMarketData.marketIndices.map((index) => (
                <div
                  key={index.name}
                  className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-4"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-[var(--text-primary)]">{index.name}</span>
                    {index.changePercent >= 0 ? (
                      <TrendingUp className="h-4 w-4 text-[var(--success)]" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-[var(--error)]" />
                    )}
                  </div>
                  <p className="font-display text-2xl font-bold text-[var(--text-primary)]">
                    {index.value.toLocaleString()}
                  </p>
                  <p
                    className={cn(
                      "text-sm font-semibold mt-1",
                      index.changePercent >= 0 ? "text-[var(--success)]" : "text-[var(--error)]"
                    )}
                  >
                    {index.changePercent >= 0 ? "+" : ""}
                    {index.changePercent.toFixed(2)}%
                  </p>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>
      )}

      {/* Trading Signals */}
      {realTimeMarketData && realTimeMarketData.tradingSignals.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card padding="md" rgbBorder>
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <LineChart className="h-5 w-5 text-[var(--accent)]" />
                <h3 className="text-sm font-medium text-[var(--text-primary)]">Trading Signals</h3>
              </div>
              <span className="text-xs text-[var(--text-muted)]">
                {realTimeMarketData.tradingSignals.length} signals
              </span>
            </div>
            <div className="space-y-3">
              {realTimeMarketData.tradingSignals.map((signal) => {
                const product = products.find((p) => p.id === signal.productId);
                if (!product) return null;
                return (
                  <div
                    key={signal.productId}
                    className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-4"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <ProductImage product={product} className="h-11 w-11 rounded-xl text-2xl" />
                        <div>
                          <h4 className="font-medium text-[var(--text-primary)]">{product.name}</h4>
                          <p className="text-xs text-[var(--text-muted)]">{product.category}</p>
                        </div>
                      </div>
                      <Badge className={cn("flex items-center gap-1", getSignalColor(signal.signal))}>
                        {getSignalIcon(signal.signal)}
                        {signal.signal.replace("_", " ").toUpperCase()}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-[var(--text-muted)] text-xs">Entry Price</p>
                        <p className="font-semibold text-[var(--text-primary)]">
                          {formatCurrency(signal.entryPrice)}
                        </p>
                      </div>
                      <div>
                        <p className="text-[var(--text-muted)] text-xs">Target Price</p>
                        <p className="font-semibold text-[var(--success)]">
                          {formatCurrency(signal.targetPrice)}
                        </p>
                      </div>
                      <div>
                        <p className="text-[var(--text-muted)] text-xs">Stop Loss</p>
                        <p className="font-semibold text-[var(--error)]">
                          {formatCurrency(signal.stopLoss)}
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-[var(--border)]">
                      <p className="text-xs text-[var(--text-muted)]">
                        <span className="font-medium">Reason:</span> {signal.reason}
                      </p>
                      <div className="mt-2 flex items-center gap-2">
                        <span className="text-xs text-[var(--text-muted)]">Signal Strength:</span>
                        <div className="flex-1 h-2 rounded-full bg-[var(--background)] overflow-hidden">
                          <div
                            className="rgb-fill h-full transition-all duration-500"
                            style={{ width: `${signal.strength}%` }}
                          />
                        </div>
                        <span className="text-xs font-semibold text-[var(--text-primary)]">
                          {signal.strength}%
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </motion.div>
      )}

      {/* Strategy Selection */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card padding="md" rgbBorder>
          <div className="mb-4 flex items-center gap-2">
            <Target className="h-5 w-5 text-[var(--accent)]" />
            <h3 className="text-sm font-medium text-[var(--text-primary)]">Trading Strategies</h3>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
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
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[var(--text-muted)]">Risk Tolerance</span>
                      <span className="font-semibold text-[var(--text-primary)]">
                        {strategy.riskTolerance}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[var(--text-muted)]">Target Return</span>
                      <span className="font-semibold text-[var(--success)]">
                        {strategy.targetReturn}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[var(--text-muted)]">Time Horizon</span>
                      <span className="font-semibold text-[var(--text-primary)] capitalize">
                        {strategy.timeHorizon}
                      </span>
                    </div>
                  </div>
                  {isSelected && (
                    <div className="mt-3 pt-3 border-t border-[var(--border)]">
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          applyMarketStrategy();
                        }}
                        size="sm"
                        className="w-full"
                      >
                        Apply Strategy
                      </Button>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </Card>
      </motion.div>

      {/* Market Analysis Summary */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card padding="md" rgbBorder>
          <div className="mb-4 flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-[var(--accent)]" />
            <h3 className="text-sm font-medium text-[var(--text-primary)]">Market Analysis Summary</h3>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {products.slice(0, 4).map((product) => {
              const analysis = getMarketAnalysis(product.id);
              if (!analysis) return null;
              return (
                <div
                  key={product.id}
                  className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-4"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <ProductImage product={product} className="h-9 w-9 rounded-lg text-lg" />
                    <span className="text-sm font-medium text-[var(--text-primary)]">
                      {product.name}
                    </span>
                  </div>
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[var(--text-muted)]">Price</span>
                      <span className="font-semibold text-[var(--text-primary)]">
                        {formatCurrency(analysis.price.currentPrice)}
                      </span>
                    </div>
                    {analysis.price.discount > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="text-[var(--text-muted)]">Discount</span>
                        <span className="font-semibold text-[var(--success)]">
                          -{analysis.price.discount}%
                        </span>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-[var(--text-muted)]">Trend</span>
                      <span
                        className={cn(
                          "font-semibold capitalize",
                          analysis.trend.trend === "rising"
                            ? "text-[var(--warning)]"
                            : analysis.trend.trend === "falling"
                            ? "text-[var(--success)]"
                            : "text-[var(--text-muted)]"
                        )}
                      >
                        {analysis.trend.trend}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[var(--text-muted)]">Sentiment</span>
                      <span
                        className={cn(
                          "font-semibold capitalize",
                          analysis.sentiment.sentiment === "positive"
                            ? "text-[var(--success)]"
                            : analysis.sentiment.sentiment === "negative"
                            ? "text-[var(--error)]"
                            : "text-[var(--text-muted)]"
                        )}
                      >
                        {analysis.sentiment.sentiment}
                      </span>
                    </div>
                    <div className="pt-2 border-t border-[var(--border)]">
                      <div className="flex items-center gap-1">
                        {analysis.recommendation === "buy" ? (
                          <CheckCircle className="h-3 w-3 text-[var(--success)]" />
                        ) : analysis.recommendation === "sell" ? (
                          <AlertTriangle className="h-3 w-3 text-[var(--error)]" />
                        ) : (
                          <Minus className="h-3 w-3 text-[var(--warning)]" />
                        )}
                        <span className="font-semibold uppercase text-[var(--text-primary)]">
                          {analysis.recommendation}
                        </span>
                      </div>
                      <p className="text-[var(--text-muted)] mt-1">
                        Confidence: {analysis.confidence}%
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
