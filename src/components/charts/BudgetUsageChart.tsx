import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

interface BudgetUsageChartProps {
  value: number;
  size?: number;
}

export function BudgetUsageChart({ value, size = 140 }: BudgetUsageChartProps) {
  const used = Math.min(100, Math.max(0, value));
  const remaining = 100 - used;

  const data = [
    { name: "Used", value: used },
    { name: "Remaining", value: remaining },
  ];

  return (
    <div className="relative" style={{ width: size, height: size }}>
      {/* Rotating spectrum arc behind the donut */}
      <div
        aria-hidden
        className="rgb-ring"
        style={{
          position: "absolute",
          inset: size * 0.16,
          borderRadius: "9999px",
          opacity: 0.35,
        }}
      />

      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <defs>
            <linearGradient id="budget-used" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="var(--rgb-1)" />
              <stop offset="35%" stopColor="var(--rgb-2)" />
              <stop offset="65%" stopColor="var(--rgb-3)" />
              <stop offset="100%" stopColor="var(--rgb-4)" />
            </linearGradient>
          </defs>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={size * 0.35}
            outerRadius={size * 0.45}
            startAngle={90}
            endAngle={-270}
            dataKey="value"
            stroke="none"
            animationDuration={900}
            animationEasing="ease-out"
          >
            <Cell fill="url(#budget-used)" />
            <Cell fill="var(--background)" />
          </Pie>
        </PieChart>
      </ResponsiveContainer>

      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-2xl font-bold text-[var(--text-primary)]">
          {used.toFixed(0)}%
        </span>
        <span className="text-xs text-[var(--text-muted)]">Budget Used</span>
      </div>
    </div>
  );
}