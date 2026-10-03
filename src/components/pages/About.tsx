import { motion } from "framer-motion";
import { GitBranch, Brain, Shield, Zap, Heart } from "lucide-react";
import { Card } from "../ui/Card";
import { Logo, LogoMark } from "../brand/Logo";

export function About() {
  const features = [
    {
      icon: Brain,
      title: "Dynamic Programming",
      description:
        "SmartCart uses the classic 0/1 knapsack algorithm to maximize utility within your budget.",
    },
    {
      icon: Zap,
      title: "Instant Optimization",
      description:
        "Run the optimizer in real-time and see the best product combination calculated instantly.",
    },
    {
      icon: Shield,
      title: "Budget First",
      description:
        "Every recommendation respects your budget boundary so you never overspend.",
    },
    {
      icon: GitBranch,
      title: "Interactive Visualizer",
      description:
        "Learn how Dynamic Programming builds the optimal solution step-by-step.",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-[var(--text-primary)] sm:text-3xl">
          About <span className="rgb-text-soft">SmartCart AI</span>
        </h1>
        <p className="mt-1 text-[var(--text-secondary)]">
          A modern shopping cart optimizer powered by intelligent algorithms.
        </p>
      </div>

      {/* Identity showcase */}
      <Card padding="lg" rgbBorderActive rgbBorder className="relative overflow-hidden">
        <div className="rgb-surface absolute inset-0" />
        <div className="relative flex flex-col items-start gap-6 sm:flex-row sm:items-center">
          <LogoMark size={96} className="shrink-0" />

          <div className="min-w-0">
            <Logo size={48} markOnly={false} compact className="mb-3" />
            <h2 className="font-display text-xl font-bold text-[var(--text-primary)]">
              Build smarter carts, effortlessly.
            </h2>
            <p className="mt-2 max-w-2xl leading-relaxed text-[var(--text-secondary)]">
              SmartCart AI helps you make better purchasing decisions by finding the optimal
              combination of products that delivers the highest total utility without exceeding
              your budget. It combines clean, modern product design with the power of Dynamic
              Programming.
            </p>
          </div>
        </div>

        {/* Spectrum hairline closing the panel */}
        <div className="relative mt-6">
          <div className="rgb-hairline" />
        </div>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        {features.map((feature, index) => {
          const Icon = feature.icon;
          return (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
            >
              <Card padding="md" hover rgbBorder>
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent-subtle)] text-[var(--accent)]">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="font-medium text-[var(--text-primary)]">{feature.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-[var(--text-secondary)]">
                  {feature.description}
                </p>
              </Card>
            </motion.div>
          );
        })}
      </div>

      <Card
        padding="md"
        rgbBorder
        className="flex flex-col items-center justify-center gap-2 text-center text-sm text-[var(--text-muted)] sm:flex-row sm:text-left"
      >
        <Heart className="h-4 w-4 shrink-0 text-[var(--error)]" />
        <span>Designed with clarity, performance, and simplicity in mind.</span>
      </Card>
    </div>
  );
}
