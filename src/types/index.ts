export interface Product {
  id: string;
  name: string;
  price: number;
  utility: number;
  emoji: string;
  /** Real product photo. Optional so user-added products still work with just an emoji. */
  image?: string;
  category?: string;
}

export interface Scenario {
  id: string;
  name: string;
  budget: number;
  utility: number;
  products: Product[];
  updatedAt: Date;
}

export interface OptimizationResult {
  selectedProducts: Product[];
  totalCost: number;
  totalUtility: number;
  remainingBudget: number;
  budgetUsed: number;
}

export interface DPStep {
  i: number;
  w: number;
  include: number;
  exclude: number;
  decision: "include" | "exclude" | "skip";
  value: number;
  product: Product | null;
  prevWeight: number;
  explanation: string;
}

export type Page =
  | "dashboard"
  | "products"
  | "optimizer"
  | "visualizer"
  | "analytics"
  | "scenarios"
  | "market"
  | "wishlist"
  | "alerts"
  | "about"
  | "settings";

export type SortOption = "name" | "price-asc" | "price-desc" | "utility-desc" | "ratio-desc";

// Re-export market types
export * from "./market";

// Re-export alerts types
export * from "./alerts";
