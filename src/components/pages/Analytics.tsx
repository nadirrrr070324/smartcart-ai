import { useState } from "react";
import { motion } from "framer-motion";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  ZAxis,
  Cell,
} from "recharts";
import { Package, TrendingUp, IndianRupee, Target } from "lucide-react";
import { useApp } from "../../context/AppContext";
import { Card } from "../ui/Card";
import { formatCurrency } from "../../utils/optimization";
import { cn } from "../../utils/cn";

type Tab = "cost" | "utility" | "selection" | "efficiency";

export function Analytics() {
  const { products, optimizationResult, selectedIds } = useApp();
  const [activeTab, setActiveTab] = useState<Tab>("cost");

  const avgUtility = products.length
    ? Math.round(products.reduce((sum, p) => sum + p.utility, 0) / products.length)
    : 0;
  const avgPrice = products.length
    ? Math.round(products.reduce((sum, p) => sum + p.price, 0) / products.length)
    : 0;
  const efficiency = optimizationResult
    ? Math.round((optimizationResult.totalUtility / products.reduce((sum, p) => sum + p.utility, 0)) * 100)
    : 0;

  const selectedProducts = products.filter((p) => selectedIds.includes(p.id));
  const utilityData = selectedProducts.map((p) => ({
    name: p.name,
    utility: p.utility,
    cost: p.price,
    emoji: p.emoji,
  }));

  const scatterData = products.map((p) => ({
    x: p.price,
    y: p.utility,
    z: p.utility / p.price,
    name: p.name,
    selected: selectedIds.includes(p.id),
  }));

  const tabs: { value: Tab; label: string }[] = [
    { value: "cost", label: "Cost" },
    { value: "utility", label: "Utility" },
    { value: "selection", label: "Selection" },
    { value: "efficiency", label: "Efficiency" },
  ];

  /** Spectrum stops shared by every chart in this page. */
  const spectrumStops = (
    <defs>
      <linearGradient id="chart-bar" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="var(--rgb-3)" />
        <stop offset="55%" stopColor="var(--rgb-2)" />
        <stop offset="100%" stopColor="var(--rgb-1)" />
      </linearGradient>
      <linearGradient id="chart-dot" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="var(--rgb-4)" />
        <stop offset="100%" stopColor="var(--rgb-2)" />
      </linearGradient>
      <linearGradient id="chart-ring" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="var(--rgb-1)" />
        <stop offset="50%" stopColor="var(--rgb-3)" />
        <stop offset="100%" stopColor="var(--rgb-4)" />
      </linearGradient>
    </defs>
  );

  const tooltipStyle = {
    backgroundColor: "var(--surface)",
    border: "1px solid var(--border)",
    borderRadius: "12px",
    boxShadow: "var(--shadow-md)",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-[var(--text-primary)] sm:text-3xl">
          Shopping <span className="rgb-text-soft">Analytics</span>
        </h1>
        <p className="mt-1 text-[var(--text-secondary)]">
          Understand how your cart performs at a glance.
        </p>
      </div>

      {/* Metric Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          icon={Package}
          label="Total Products"
          value={products.length.toString()}
          color="text-blue-500"
          bg="bg-blue-500/10"
          delay={0}
        />
        <MetricCard
          icon={TrendingUp}
          label="Average Utility"
          value={avgUtility.toString()}
          color="text-emerald-500"
          bg="bg-emerald-500/10"
          delay={0.05}
        />
        <MetricCard
          icon={IndianRupee}
          label="Average Price"
          value={formatCurrency(avgPrice)}
          color="text-amber-500"
          bg="bg-amber-500/10"
          delay={0.1}
        />
        <MetricCard
          icon={Target}
          label="Optimization Efficiency"
          value={`${efficiency}%`}
          color="text-violet-500"
          bg="bg-violet-500/10"
          delay={0.15}
        />
      </div>

      {/* Tabs */}
      <Card padding="sm" hover={false} rgbBorderActive rgbBorder>
        <div className="flex gap-1 overflow-x-auto border-b border-[var(--border)] pb-3">
          {tabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={cn(
                "shrink-0 rounded-lg px-4 py-2 text-sm font-medium transition-colors focus-ring",
                activeTab === tab.value
                  ? "rgb-fill text-white shadow-sm"
                  : "text-[var(--text-secondary)] hover:bg-[var(--background)] hover:text-[var(--text-primary)]"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="mt-4 min-h-[360px]">
          {activeTab === "cost" && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="h-[360px]"
            >
              <h3 className="mb-2 text-sm font-medium text-[var(--text-primary)]">Cost Distribution</h3>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={utilityData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                  {spectrumStops}
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis
                    dataKey="name"
                    tick={{ fill: "var(--text-muted)", fontSize: 12 }}
                    axisLine={{ stroke: "var(--border)" }}
                    tickLine={false}
                    angle={-20}
                    textAnchor="end"
                  />
                  <YAxis
                    tick={{ fill: "var(--text-muted)", fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(value) => `₹${value}`}
                  />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(value) => [formatCurrency(Number(value || 0)), "Cost"]}
                  />
                  <Bar dataKey="cost" radius={[6, 6, 0, 0]} animationDuration={800}>
                    {utilityData.map((_entry, index) => (
                      <Cell key={`cell-${index}`} fill="url(#chart-bar)" />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </motion.div>
          )}

          {activeTab === "utility" && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="h-[360px]"
            >
              <h3 className="mb-2 text-sm font-medium text-[var(--text-primary)]">Utility Contribution</h3>
              <div className="space-y-4 pt-4">
                {utilityData
                  .sort((a, b) => b.utility - a.utility)
                  .map((item) => {
                    const max = Math.max(...utilityData.map((d) => d.utility));
                    const percent = (item.utility / max) * 100;
                    return (
                      <div key={item.name}>
                        <div className="mb-1 flex items-center justify-between text-sm">
                          <span className="flex items-center gap-2 text-[var(--text-primary)]">
                            <span>{item.emoji}</span>
                            {item.name}
                          </span>
                          <span className="font-medium text-[var(--success)]">{item.utility}</span>
                        </div>
                        <div className="h-2.5 w-full overflow-hidden rounded-full bg-[var(--background)]">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${percent}%` }}
                            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                            className="rgb-fill h-full rounded-full"
                          />
                        </div>
                      </div>
                    );
                  })}
                {utilityData.length === 0 && (
                  <p className="py-20 text-center text-sm text-[var(--text-muted)]">
                    Select products in the optimizer to see utility contribution.
                  </p>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === "selection" && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="h-[360px]"
            >
              <h3 className="mb-2 text-sm font-medium text-[var(--text-primary)]">Cost vs Utility</h3>
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 10, right: 10, bottom: 10, left: 0 }}>
                  {spectrumStops}
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis
                    type="number"
                    dataKey="x"
                    name="Price"
                    tick={{ fill: "var(--text-muted)", fontSize: 12 }}
                    axisLine={{ stroke: "var(--border)" }}
                    tickLine={false}
                    tickFormatter={(value) => `₹${value}`}
                  />
                  <YAxis
                    type="number"
                    dataKey="y"
                    name="Utility"
                    tick={{ fill: "var(--text-muted)", fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <ZAxis type="number" dataKey="z" range={[60, 200]} />
                  <Tooltip
                    cursor={{ strokeDasharray: "3 3" }}
                    contentStyle={tooltipStyle}
                    formatter={(value, name) => [
                      name === "x" ? formatCurrency(Number(value || 0)) : value,
                      name === "x" ? "Price" : "Utility",
                    ]}
                    labelFormatter={(_, payload) => {
                      const item = payload?.[0]?.payload as { emoji: string; name: string } | undefined;
                      return item ? `${item.emoji} ${item.name}` : "";
                    }}
                  />
                  <Scatter data={scatterData} animationDuration={900}>
                    {scatterData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.selected ? "url(#chart-dot)" : "url(#chart-bar)"}
                        fillOpacity={entry.selected ? 1 : 0.45}
                        stroke={entry.selected ? "var(--rgb-4)" : "transparent"}
                        strokeWidth={2}
                      />
                    ))}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            </motion.div>
          )}

          {activeTab === "efficiency" && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="flex h-[360px] flex-col items-center justify-center"
            >
              <div className="relative flex h-40 w-40 items-center justify-center">
                {/* Rotating spectrum halo behind the gauge */}
                <div
                  aria-hidden
                  className="rgb-ring"
                  style={{ position: "absolute", inset: 0, borderRadius: "9999px", opacity: 0.4 }}
                />
                <svg className="h-full w-full -rotate-90" viewBox="0 0 36 36">
                  {spectrumStops}
                  <path
                    className="text-[var(--background)]"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                  />
                  <motion.path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="url(#chart-ring)"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeDasharray={`${efficiency}, 100`}
                    initial={{ strokeDasharray: "0, 100" }}
                    animate={{ strokeDasharray: `${efficiency}, 100` }}
                    transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="font-display text-3xl font-bold text-[var(--text-primary)]">
                    {efficiency}%
                  </span>
                </div>
              </div>
              <p className="mt-4 text-center text-sm text-[var(--text-secondary)]">
                {efficiency > 80
                  ? "Excellent! Your cart captures most available utility."
                  : efficiency > 50
                  ? "Good progress. Try adding more products to optimize."
                  : "Select products and run the optimizer to improve efficiency."}
              </p>
            </motion.div>
          )}
        </div>
      </Card>
    </div>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  color,
  bg,
  delay,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  color: string;
  bg: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
    >
      <Card padding="md" hover rgbBorder>
        <div className="flex items-start justify-between">
          <div className="min-w-0">
            <p className="text-sm text-[var(--text-secondary)]">{label}</p>
            <p className="font-display mt-1.5 text-2xl font-bold text-[var(--text-primary)]">{value}</p>
          </div>
          <div className={cn("rounded-xl p-2", bg, color)}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
