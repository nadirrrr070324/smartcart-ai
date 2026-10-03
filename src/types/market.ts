export interface MarketPrice {
  productId: string;
  currentPrice: number;
  originalPrice: number;
  discount: number;
  source: string;
  lastUpdated: Date;
  priceHistory: PriceHistoryPoint[];
}

export interface PriceHistoryPoint {
  date: Date;
  price: number;
  /** Present on multi-retailer series; omitted by single-source market data. */
  retailer?: string;
}

export interface MarketTrend {
  productId: string;
  trend: "rising" | "falling" | "stable";
  changePercent: number;
  demandScore: number;
  popularityRank: number;
  predictedPrice: number;
  confidence: number;
}

export interface MarketSentiment {
  productId: string;
  sentiment: "positive" | "neutral" | "negative";
  reviewCount: number;
  averageRating: number;
  socialMentions: number;
  newsSentiment: number;
}

export interface TradingStrategy {
  id: string;
  name: string;
  description: string;
  type: "conservative" | "balanced" | "aggressive";
  riskTolerance: number;
  targetReturn: number;
  timeHorizon: "short" | "medium" | "long";
  allocationRules: AllocationRule[];
}

export interface AllocationRule {
  category: string;
  minPercentage: number;
  maxPercentage: number;
  priority: number;
}

export interface StockMarketData {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap: number;
  peRatio: number;
  dividendYield: number;
  beta: number;
}

export interface MarketAnalysis {
  productId: string;
  price: MarketPrice;
  trend: MarketTrend;
  sentiment: MarketSentiment;
  recommendation: "buy" | "hold" | "sell";
  confidence: number;
  factors: string[];
}

export interface RealTimeMarketData {
  timestamp: Date;
  products: Map<string, MarketAnalysis>;
  marketIndices: MarketIndex[];
  tradingSignals: TradingSignal[];
}

export interface MarketIndex {
  name: string;
  value: number;
  change: number;
  changePercent: number;
}

export interface TradingSignal {
  productId: string;
  signal: "strong_buy" | "buy" | "hold" | "sell" | "strong_sell";
  strength: number;
  reason: string;
  entryPrice: number;
  targetPrice: number;
  stopLoss: number;
}

/* ============================================================
   MULTI-RETAILER
   ============================================================ */

export interface Retailer {
  id: string;
  name: string;
  baseUrl: string;
  logo: string;
  active: boolean;
  /** Typical price position against the category average (1 = market rate). */
  priceFactor: number;
  /** Out of 5, from aggregated buyer reviews. */
  rating: number;
  ratingCount: number;
  /** Typical doorstep delivery in days. */
  deliveryDays: number;
  deliveryFee: number;
  codAvailable: boolean;
  /** Categories this retailer stocks; an empty list means "everything". */
  categories: string[];
  tags: string[];
}

export interface RetailerOffer {
  retailerId: string;
  retailerName: string;
  retailerLogo: string;
  productId: string;
  /** Price after discount, before delivery. */
  price: number;
  mrp: number;
  discountPercent: number;
  inStock: boolean;
  deliveryDays: number;
  deliveryFee: number;
  /** price + deliveryFee — what the comparison ranks on. */
  landedCost: number;
  rating: number;
  offers: string[];
  url: string;
}

export interface RetailerComparison {
  productId: string;
  offers: RetailerOffer[];
  best: RetailerOffer | null;
  worst: RetailerOffer | null;
  /** Landed-cost spread between cheapest and dearest stocked offer. */
  spread: number;
  spreadPercent: number;
  /** Landed cost if every item were bought at the dearest retailer. */
  worstCaseTotal: number;
  bestCaseTotal: number;
  savings: number;
  retailerCount: number;
}

export interface RetailerScoreboard {
  retailer: Retailer;
  offers: number;
  inStock: number;
  /** Share of products where this retailer had the cheapest landed cost. */
  winRate: number;
  avgDiscountPercent: number;
  avgLandedCost: number;
  totalSavings: number;
}

/* ============================================================
   HISTORICAL PRICE CHARTS
   ============================================================ */

export interface RetailerSeries {
  retailerId: string;
  retailerName: string;
  retailerLogo: string;
  color: string;
  points: PriceHistoryPoint[];
}

export interface DailyBestPrice {
  date: Date;
  price: number;
  retailerId: string;
  retailerName: string;
}

export interface PriceHistoryBundle {
  productId: string;
  days: number;
  series: RetailerSeries[];
  /** Cheapest landed price on each day across every tracked retailer. */
  bestPerDay: DailyBestPrice[];
  lowest: DailyBestPrice | null;
  highest: DailyBestPrice | null;
  average: number;
  median: number;
  current: number;
  /** Percent move across the whole window. */
  changePercent: number;
  /** Standard deviation as a percentage of the mean. */
  volatility: number;
  /** Days between the lowest price and today. */
  daysSinceLow: number;
  isGoodDeal: boolean;
}
