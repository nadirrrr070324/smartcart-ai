import { describe, expect, it } from "vitest";
import {
  formatCurrency,
  formatRatio,
  generateDPSteps,
  generateId,
  optimizeCart,
} from "./optimization";
import type { Product } from "../types";

function makeProduct(id: string, price: number, utility: number): Product {
  return { id, name: `Product ${id}`, price, utility, emoji: "📦", category: "Test" };
}

/** Reference implementation: exhaustive search, only viable for tiny inputs. */
function bruteForceOptimalUtility(products: Product[], budget: number): number {
  const capacity = Math.floor(budget / 10) * 10;
  let best = 0;

  for (let mask = 0; mask < 1 << products.length; mask++) {
    let cost = 0;
    let utility = 0;
    for (let i = 0; i < products.length; i++) {
      if (mask & (1 << i)) {
        cost += products[i].price;
        utility += products[i].utility;
      }
    }
    if (cost <= capacity && utility > best) {
      best = utility;
    }
  }

  return best;
}

/** Deterministic pseudo-random generator so failures are reproducible. */
function lcg(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0x1_0000_0000;
  };
}

describe("optimizeCart", () => {
  it("returns an empty selection for an empty catalogue", () => {
    const result = optimizeCart([], 1000);

    expect(result.selectedProducts).toEqual([]);
    expect(result.totalCost).toBe(0);
    expect(result.totalUtility).toBe(0);
    expect(result.remainingBudget).toBe(1000);
    expect(result.budgetUsed).toBe(0);
  });

  it("never exceeds the budget", () => {
    const products = [
      makeProduct("1", 300, 60),
      makeProduct("2", 400, 80),
      makeProduct("3", 500, 90),
    ];

    const result = optimizeCart(products, 500);

    expect(result.totalCost).toBeLessThanOrEqual(500);
  });

  it("selects the higher-utility subset when only one fits", () => {
    const products = [makeProduct("cheap", 300, 60), makeProduct("pricey", 500, 90)];

    const result = optimizeCart(products, 500);

    expect(result.selectedProducts.map((p) => p.id)).toEqual(["pricey"]);
    expect(result.totalUtility).toBe(90);
    expect(result.totalCost).toBe(500);
  });

  it("takes both items when the budget allows", () => {
    const products = [makeProduct("a", 300, 60), makeProduct("b", 400, 80)];

    const result = optimizeCart(products, 800);

    expect(result.selectedProducts.map((p) => p.id)).toEqual(["a", "b"]);
    expect(result.totalCost).toBe(700);
    expect(result.totalUtility).toBe(140);
    expect(result.remainingBudget).toBe(100);
  });

  it("rounds the budget down to a multiple of ten before allocating", () => {
    const products = [makeProduct("a", 95, 10), makeProduct("b", 6, 5)];

    // 105 -> effective capacity 100, so both (95 + 6 = 101) no longer fit.
    const result = optimizeCart(products, 105);

    expect(result.totalCost).toBeLessThanOrEqual(100);
  });

  it("skips products that cannot afford on their own", () => {
    const products = [makeProduct("huge", 5000, 999), makeProduct("small", 100, 10)];

    const result = optimizeCart(products, 500);

    expect(result.selectedProducts.map((p) => p.id)).toEqual(["small"]);
  });

  it("handles a zero budget without producing NaN", () => {
    const products = [makeProduct("a", 100, 10)];

    const result = optimizeCart(products, 0);

    expect(result.selectedProducts).toEqual([]);
    expect(result.totalCost).toBe(0);
    expect(result.budgetUsed).toBe(0);
    expect(Number.isNaN(result.budgetUsed)).toBe(false);
  });

  it("keeps free products because they cost nothing", () => {
    const products = [makeProduct("free", 0, 25), makeProduct("paid", 400, 10)];

    const result = optimizeCart(products, 400);

    // Both fit: the free item adds utility without touching the budget.
    expect(result.selectedProducts.map((p) => p.id)).toEqual(["free", "paid"]);
    expect(result.totalUtility).toBe(35);
    expect(result.totalCost).toBe(400);
  });

  it("takes a free product even when the budget is already fully spent", () => {
    const products = [makeProduct("free", 0, 25), makeProduct("paid", 400, 10)];

    // Backtracking must not stop at weight 0, or the free item is dropped.
    const exact = optimizeCart(products, 400);
    const tight = optimizeCart(products, 400);

    expect(tight.totalUtility).toBe(exact.totalUtility);
    expect(tight.selectedProducts.some((p) => p.id === "free")).toBe(true);
  });

  it("matches brute force across many generated instances", () => {
    const random = lcg(20260903);

    for (let trial = 0; trial < 60; trial++) {
      const count = 4 + Math.floor(random() * 7);
      const products: Product[] = Array.from({ length: count }, (_, index) =>
        makeProduct(
          `p${index}`,
          Math.round(random() * 450) + 10,
          Math.round(random() * 90) + 1
        )
      );
      const budget = Math.round(random() * 1200) + 50;

      const result = optimizeCart(products, budget);

      expect(result.totalUtility).toBe(bruteForceOptimalUtility(products, budget));
      expect(result.totalCost).toBeLessThanOrEqual(Math.floor(budget / 10) * 10);
    }
  });

  it("reports totals that agree with the selected products", () => {
    const products = [
      makeProduct("a", 120, 30),
      makeProduct("b", 250, 70),
      makeProduct("c", 90, 15),
    ];

    const result = optimizeCart(products, 400);

    expect(result.totalCost).toBe(
      result.selectedProducts.reduce((sum, p) => sum + p.price, 0)
    );
    expect(result.totalUtility).toBe(
      result.selectedProducts.reduce((sum, p) => sum + p.utility, 0)
    );
    expect(result.remainingBudget).toBe(400 - result.totalCost);
  });

  it("uses the full budget when it can", () => {
    const products = [makeProduct("a", 250, 25), makeProduct("b", 250, 25)];

    const result = optimizeCart(products, 500);

    expect(result.budgetUsed).toBe(100);
  });
});

describe("generateDPSteps", () => {
  it("emits one step per (item, weight) cell plus the base row", () => {
    const products = [makeProduct("a", 100, 10), makeProduct("b", 200, 20)];
    const budget = 200;
    const stride = Math.floor(budget / 10) * 10 + 1;

    const steps = generateDPSteps(products, budget);

    expect(steps).toHaveLength((products.length + 1) * stride);
  });

  it("marks the base row as skipped with zero utility", () => {
    const steps = generateDPSteps([makeProduct("a", 100, 10)], 100);
    const baseRow = steps.filter((step) => step.i === 0);

    expect(baseRow).toHaveLength(101);
    expect(baseRow.every((step) => step.decision === "skip")).toBe(true);
    expect(baseRow.every((step) => step.value === 0)).toBe(true);
    expect(baseRow.every((step) => step.product === null)).toBe(true);
  });

  it("skips an item that is heavier than the remaining weight", () => {
    const steps = generateDPSteps([makeProduct("heavy", 300, 50)], 200);
    const row = steps.filter((step) => step.i === 1);

    expect(row.filter((step) => step.decision === "skip")).toHaveLength(201);
    expect(row.every((step) => step.include === 0)).toBe(true);
  });

  it("includes an item that raises utility", () => {
    const steps = generateDPSteps([makeProduct("light", 50, 25)], 100);
    const includes = steps.filter((step) => step.i === 1 && step.decision === "include");

    expect(includes.length).toBeGreaterThan(0);
    expect(includes.every((step) => step.include === 25)).toBe(true);
  });

  it("explains every step", () => {
    const steps = generateDPSteps([makeProduct("a", 120, 30), makeProduct("b", 80, 20)], 200);

    expect(steps.every((step) => step.explanation.length > 0)).toBe(true);
  });

  it("final value matches optimizeCart", () => {
    const products = [makeProduct("a", 120, 30), makeProduct("b", 180, 45), makeProduct("c", 90, 15)];

    const steps = generateDPSteps(products, 300);
    const last = steps[steps.length - 1];

    expect(last.value).toBe(optimizeCart(products, 300).totalUtility);
  });
});

describe("formatCurrency", () => {
  it("prefixes the rupee sign and groups in Indian notation", () => {
    expect(formatCurrency(1234567)).toBe("₹12,34,567");
  });

  it("formats small amounts without grouping", () => {
    expect(formatCurrency(250)).toBe("₹250");
  });

  it("handles zero and negatives", () => {
    expect(formatCurrency(0)).toBe("₹0");
    expect(formatCurrency(-500)).toBe("-₹500");
  });
});

describe("formatRatio", () => {
  it("guards against division by zero", () => {
    expect(formatRatio(10, 0)).toBe("0.00");
  });

  it("formats to two decimal places", () => {
    expect(formatRatio(10, 4)).toBe("2.50");
    expect(formatRatio(1, 3)).toBe("0.33");
  });
});

describe("generateId", () => {
  it("returns a short alphanumeric id", () => {
    const id = generateId();

    expect(typeof id).toBe("string");
    expect(id.length).toBeGreaterThan(0);
    expect(id.length).toBeLessThanOrEqual(7);
    expect(id).toMatch(/^[a-z0-9]+$/);
  });

  it("does not collide across many calls", () => {
    const ids = new Set(Array.from({ length: 500 }, () => generateId()));

    expect(ids.size).toBe(500);
  });
});