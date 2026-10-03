import { Product, OptimizationResult, DPStep } from "../types";

export function optimizeCart(products: Product[], budget: number): OptimizationResult {
  const n = products.length;
  const roundedBudget = Math.floor(budget / 10) * 10;
  
  // dp[i][w] = max utility using first i products with budget w
  const dp: number[][] = Array.from({ length: n + 1 }, () =>
    Array.from({ length: roundedBudget + 1 }, () => 0)
  );

  for (let i = 1; i <= n; i++) {
    const product = products[i - 1];
    for (let w = 0; w <= roundedBudget; w++) {
      const exclude = dp[i - 1][w];
      let include = 0;
      if (product.price <= w) {
        include = product.utility + dp[i - 1][w - product.price];
      }
      dp[i][w] = Math.max(exclude, include);
    }
  }

  // Backtrack to find selected products
  const selected: Product[] = [];
  let i = n;
  let w = roundedBudget;
  // Runs to i === 0 rather than stopping at w === 0: a zero-price product is
  // still includable at weight 0, and stopping early silently dropped it.
  while (i > 0) {
    if (dp[i][w] !== dp[i - 1][w]) {
      selected.push(products[i - 1]);
      w -= products[i - 1].price;
    }
    i--;
  }

  const totalCost = selected.reduce((sum, p) => sum + p.price, 0);
  const totalUtility = selected.reduce((sum, p) => sum + p.utility, 0);
  const remainingBudget = budget - totalCost;
  // A zero (or negative) budget would make the ratio NaN and render as "NaN%".
  const budgetUsed = budget > 0 ? Math.min(100, (totalCost / budget) * 100) : 0;

  return {
    selectedProducts: selected.reverse(),
    totalCost,
    totalUtility,
    remainingBudget,
    budgetUsed,
  };
}

export function generateDPSteps(products: Product[], budget: number): DPStep[] {
  const n = products.length;
  const roundedBudget = Math.floor(budget / 10) * 10;
  const steps: DPStep[] = [];
  const dp: number[][] = Array.from({ length: n + 1 }, () =>
    Array.from({ length: roundedBudget + 1 }, () => 0)
  );

  // Initial row
  for (let w = 0; w <= roundedBudget; w++) {
    steps.push({
      i: 0,
      w,
      include: 0,
      exclude: 0,
      decision: "skip",
      value: 0,
      product: null,
      prevWeight: 0,
      explanation: `Base case: with no products, utility is 0 at every budget.`,
    });
  }

  for (let i = 1; i <= n; i++) {
    const product = products[i - 1];
    for (let w = 0; w <= roundedBudget; w++) {
      const exclude = dp[i - 1][w];
      let include = 0;
      let prevWeight = 0;
      if (product.price <= w) {
        include = product.utility + dp[i - 1][w - product.price];
        prevWeight = w - product.price;
      }
      dp[i][w] = Math.max(exclude, include);

      let decision: "include" | "exclude" | "skip" = "exclude";
      if (product.price > w) {
        decision = "skip";
      } else if (include > exclude) {
        decision = "include";
      }

      const explanation =
        decision === "skip"
          ? `${product.name} costs ₹${product.price}, which exceeds budget ₹${w}. Skip it.`
          : decision === "include"
          ? `Include ${product.name}: utility ${include} beats excluding (${exclude}).`
          : `Exclude ${product.name}: keeping previous utility ${exclude} is better.`;

      steps.push({
        i,
        w,
        include,
        exclude,
        decision,
        value: dp[i][w],
        product,
        prevWeight,
        explanation,
      });
    }
  }

  return steps;
}

export function formatCurrency(amount: number): string {
  // Sign belongs outside the symbol: -₹500, never ₹-500.
  const sign = amount < 0 ? "-" : "";
  return `${sign}₹${Math.abs(amount).toLocaleString("en-IN")}`;
}

export function formatRatio(utility: number, price: number): string {
  if (price === 0) return "0.00";
  return (utility / price).toFixed(2);
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}
