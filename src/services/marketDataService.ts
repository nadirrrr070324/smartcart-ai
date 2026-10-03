import {
  MarketPrice,
  MarketTrend,
  MarketSentiment,
  MarketAnalysis,
  RealTimeMarketData,
  MarketIndex,
  TradingSignal,
  StockMarketData,
  TradingStrategy,
} from "../types/market";
import { Product } from "../types";

/**
 * Market Data Service
 * Handles real-time market data fetching, analysis, and trading signals
 */
class MarketDataService {
  private static instance: MarketDataService;
  private marketDataCache: Map<string, MarketAnalysis> = new Map();
  private updateInterval: number = 30000; // 30 seconds
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private subscribers: Set<(data: RealTimeMarketData) => void> = new Set();

  private constructor() {
    this.startRealTimeUpdates();
  }

  static getInstance(): MarketDataService {
    if (!MarketDataService.instance) {
      MarketDataService.instance = new MarketDataService();
    }
    return MarketDataService.instance;
  }

  /**
   * Subscribe to real-time market data updates
   */
  subscribe(callback: (data: RealTimeMarketData) => void): () => void {
    this.subscribers.add(callback);
    // Immediately send current data
    callback(this.getCurrentMarketData());
    // Set.delete returns a boolean, which is not a valid effect destructor —
    // the unsubscribe handle has to be typed as returning void.
    return () => {
      this.subscribers.delete(callback);
    };
  }

  /**
   * Start real-time market data updates
   */
  private startRealTimeUpdates() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }

    this.intervalId = setInterval(() => {
      this.updateMarketData();
    }, this.updateInterval);
  }

  /**
   * Stop real-time updates
   */
  stopRealTimeUpdates() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  /**
   * Update market data for all products
   */
  private async updateMarketData() {
    const products = this.marketDataCache.keys();
    for (const productId of products) {
      const analysis = await this.fetchMarketAnalysis(productId);
      if (analysis) {
        this.marketDataCache.set(productId, analysis);
      }
    }
    this.notifySubscribers();
  }

  /**
   * Notify all subscribers of data updates
   */
  private notifySubscribers() {
    const data = this.getCurrentMarketData();
    this.subscribers.forEach((callback) => callback(data));
  }

  /**
   * Get current market data
   */
  getCurrentMarketData(): RealTimeMarketData {
    return {
      timestamp: new Date(),
      products: this.marketDataCache,
      marketIndices: this.getMockMarketIndices(),
      tradingSignals: this.generateTradingSignals(),
    };
  }

  /**
   * Fetch market analysis for a product
   */
  async fetchMarketAnalysis(productId: string): Promise<MarketAnalysis | null> {
    // In production, this would call real APIs
    // For now, we generate mock data
    return this.generateMockMarketAnalysis(productId);
  }

  /**
   * Fetch real-time e-commerce prices
   */
  async fetchEcommercePrices(product: Product): Promise<MarketPrice> {
    // Simulate API call to e-commerce platforms
    // In production: Amazon API, Flipkart API, etc.
    const currentPrice = product.price * (0.85 + Math.random() * 0.3);
    const discount = Math.round((1 - currentPrice / product.price) * 100);

    // Generate price history
    const priceHistory: Array<{ date: Date; price: number }> = [];
    const now = new Date();
    for (let i = 30; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const historicalPrice = product.price * (0.9 + Math.random() * 0.2);
      priceHistory.push({ date, price: historicalPrice });
    }

    return {
      productId: product.id,
      currentPrice,
      originalPrice: product.price,
      discount,
      source: "Multiple Retailers",
      lastUpdated: new Date(),
      priceHistory,
    };
  }

  /**
   * Analyze market trends
   */
  async analyzeMarketTrend(product: Product): Promise<MarketTrend> {
    const price = await this.fetchEcommercePrices(product);
    const recentPrices = price.priceHistory.slice(-7);
    const avgRecentPrice = recentPrices.reduce((sum, p) => sum + p.price, 0) / recentPrices.length;
    const changePercent = ((price.currentPrice - avgRecentPrice) / avgRecentPrice) * 100;

    let trend: "rising" | "falling" | "stable";
    if (changePercent > 2) trend = "rising";
    else if (changePercent < -2) trend = "falling";
    else trend = "stable";

    return {
      productId: product.id,
      trend,
      changePercent,
      demandScore: Math.round(50 + Math.random() * 50),
      popularityRank: Math.round(Math.random() * 100) + 1,
      predictedPrice: price.currentPrice * (0.95 + Math.random() * 0.1),
      confidence: Math.round(70 + Math.random() * 30),
    };
  }

  /**
   * Analyze market sentiment
   */
  async analyzeMarketSentiment(product: Product): Promise<MarketSentiment> {
    const reviewCount = Math.floor(Math.random() * 5000) + 100;
    const averageRating = 3 + Math.random() * 2;
    const socialMentions = Math.floor(Math.random() * 10000);
    const newsSentiment = (Math.random() - 0.5) * 2;

    let sentiment: "positive" | "neutral" | "negative";
    if (averageRating > 4) sentiment = "positive";
    else if (averageRating < 3) sentiment = "negative";
    else sentiment = "neutral";

    return {
      productId: product.id,
      sentiment,
      reviewCount,
      averageRating: Math.round(averageRating * 10) / 10,
      socialMentions,
      newsSentiment: Math.round(newsSentiment * 100) / 100,
    };
  }

  /**
   * Generate market analysis combining all data
   */
  async generateMarketAnalysis(product: Product): Promise<MarketAnalysis> {
    const price = await this.fetchEcommercePrices(product);
    const trend = await this.analyzeMarketTrend(product);
    const sentiment = await this.analyzeMarketSentiment(product);

    // Generate recommendation
    let recommendation: "buy" | "hold" | "sell";
    const factors: string[] = [];

    if (trend.trend === "falling" && price.discount > 15) {
      recommendation = "buy";
      factors.push("Price drop detected", "Good discount available");
    } else if (trend.trend === "rising" && sentiment.sentiment === "positive") {
      recommendation = "hold";
      factors.push("Price increasing", "Positive sentiment");
    } else if (sentiment.sentiment === "negative" && sentiment.averageRating < 3) {
      recommendation = "sell";
      factors.push("Poor reviews", "Negative sentiment");
    } else {
      recommendation = "hold";
      factors.push("Market conditions stable");
    }

    const confidence = Math.round(
      (trend.confidence + sentiment.averageRating * 10 + Math.abs(trend.changePercent)) / 3
    );

    return {
      productId: product.id,
      price,
      trend,
      sentiment,
      recommendation,
      confidence,
      factors,
    };
  }

  /**
   * Generate mock market analysis
   */
  private generateMockMarketAnalysis(productId: string): MarketAnalysis {
    const price = 100 + Math.random() * 400;
    const discount = Math.round(Math.random() * 30);
    const currentPrice = price * (1 - discount / 100);

    return {
      productId,
      price: {
        productId,
        currentPrice,
        originalPrice: price,
        discount,
        source: "Mock API",
        lastUpdated: new Date(),
        priceHistory: [],
      },
      trend: {
        productId,
        trend: Math.random() > 0.5 ? "rising" : "falling",
        changePercent: (Math.random() - 0.5) * 20,
        demandScore: Math.round(Math.random() * 100),
        popularityRank: Math.round(Math.random() * 100),
        predictedPrice: currentPrice * (0.95 + Math.random() * 0.1),
        confidence: Math.round(70 + Math.random() * 30),
      },
      sentiment: {
        productId,
        sentiment: Math.random() > 0.4 ? "positive" : "neutral",
        reviewCount: Math.floor(Math.random() * 5000),
        averageRating: Math.round((3 + Math.random() * 2) * 10) / 10,
        socialMentions: Math.floor(Math.random() * 10000),
        newsSentiment: Math.round((Math.random() - 0.5) * 2 * 100) / 100,
      },
      recommendation: Math.random() > 0.6 ? "buy" : "hold",
      confidence: Math.round(70 + Math.random() * 30),
      factors: ["Market analysis complete"],
    };
  }

  /**
   * Get mock market indices
   */
  private getMockMarketIndices(): MarketIndex[] {
    return [
      { name: "NIFTY 50", value: 22500 + Math.random() * 500, change: (Math.random() - 0.5) * 200, changePercent: (Math.random() - 0.5) * 2 },
      { name: "SENSEX", value: 74000 + Math.random() * 1000, change: (Math.random() - 0.5) * 500, changePercent: (Math.random() - 0.5) * 2 },
      { name: "NASDAQ", value: 18500 + Math.random() * 300, change: (Math.random() - 0.5) * 100, changePercent: (Math.random() - 0.5) * 1.5 },
    ];
  }

  /**
   * Generate trading signals
   */
  private generateTradingSignals(): TradingSignal[] {
    const signals: TradingSignal[] = [];
    const products = Array.from(this.marketDataCache.keys());

    products.forEach((productId) => {
      const analysis = this.marketDataCache.get(productId);
      if (!analysis) return;

      let signal: TradingSignal["signal"];
      if (analysis.recommendation === "buy" && analysis.confidence > 80) {
        signal = "strong_buy";
      } else if (analysis.recommendation === "buy") {
        signal = "buy";
      } else if (analysis.recommendation === "sell") {
        signal = "sell";
      } else {
        signal = "hold";
      }

      signals.push({
        productId,
        signal,
        strength: analysis.confidence,
        reason: analysis.factors.join(", "),
        entryPrice: analysis.price.currentPrice,
        targetPrice: analysis.price.currentPrice * 1.1,
        stopLoss: analysis.price.currentPrice * 0.95,
      });
    });

    return signals;
  }

  /**
   * Fetch stock market data
   */
  async fetchStockMarketData(symbols: string[]): Promise<StockMarketData[]> {
    // In production, this would call real stock APIs
    return symbols.map((symbol) => ({
      symbol,
      price: 100 + Math.random() * 1000,
      change: (Math.random() - 0.5) * 50,
      changePercent: (Math.random() - 0.5) * 5,
      volume: Math.floor(Math.random() * 10000000),
      marketCap: Math.random() * 1000000000000,
      peRatio: 10 + Math.random() * 30,
      dividendYield: Math.random() * 5,
      beta: 0.5 + Math.random() * 1.5,
    }));
  }

  /**
   * Calculate dynamic utility based on market data
   */
  calculateDynamicUtility(product: Product, marketAnalysis: MarketAnalysis): number {
    let utility = product.utility;

    // Adjust based on discount
    if (marketAnalysis.price.discount > 20) {
      utility *= 1.3;
    } else if (marketAnalysis.price.discount > 10) {
      utility *= 1.15;
    }

    // Adjust based on trend
    if (marketAnalysis.trend.trend === "falling" && marketAnalysis.trend.changePercent < -5) {
      utility *= 1.2; // Good time to buy
    }

    // Adjust based on sentiment
    if (marketAnalysis.sentiment.sentiment === "positive" && marketAnalysis.sentiment.averageRating > 4) {
      utility *= 1.15;
    } else if (marketAnalysis.sentiment.sentiment === "negative") {
      utility *= 0.85;
    }

    // Adjust based on popularity
    if (marketAnalysis.trend.popularityRank < 20) {
      utility *= 1.1;
    }

    return Math.round(utility);
  }

  /**
   * Apply trading strategy to product selection
   */
  applyTradingStrategy(
    products: Product[],
    strategy: TradingStrategy,
    marketData: Map<string, MarketAnalysis>
  ): Product[] {
    const selected: Product[] = [];
    const categoryAllocation = new Map<string, number>();

    // Sort products by trading signal strength
    const sortedProducts = [...products].sort((a, b) => {
      const analysisA = marketData.get(a.id);
      const analysisB = marketData.get(b.id);
      const signalA = analysisA?.trend.demandScore || 50;
      const signalB = analysisB?.trend.demandScore || 50;
      return signalB - signalA;
    });

    for (const product of sortedProducts) {
      const category = product.category || "General";
      const rule = strategy.allocationRules.find((r) => r.category === category);

      if (!rule) continue;

      const currentAllocation = categoryAllocation.get(category) || 0;
      const percentage = (product.price / 10000) * 100; // Assume total budget of 10000

      if (currentAllocation + percentage <= rule.maxPercentage) {
        selected.push(product);
        categoryAllocation.set(category, currentAllocation + percentage);
      }
    }

    return selected;
  }

  /**
   * Get predefined trading strategies
   */
  getPredefinedStrategies(): TradingStrategy[] {
    return [
      {
        id: "conservative",
        name: "Conservative",
        description: "Focus on stable, low-risk products with steady demand",
        type: "conservative",
        riskTolerance: 30,
        targetReturn: 15,
        timeHorizon: "long",
        allocationRules: [
          { category: "Accessories", minPercentage: 20, maxPercentage: 40, priority: 1 },
          { category: "Peripherals", minPercentage: 20, maxPercentage: 40, priority: 2 },
          { category: "Audio", minPercentage: 10, maxPercentage: 30, priority: 3 },
          { category: "Video", minPercentage: 5, maxPercentage: 20, priority: 4 },
        ],
      },
      {
        id: "balanced",
        name: "Balanced",
        description: "Mix of stable and growth-oriented products",
        type: "balanced",
        riskTolerance: 50,
        targetReturn: 25,
        timeHorizon: "medium",
        allocationRules: [
          { category: "Accessories", minPercentage: 15, maxPercentage: 35, priority: 1 },
          { category: "Peripherals", minPercentage: 15, maxPercentage: 35, priority: 2 },
          { category: "Audio", minPercentage: 15, maxPercentage: 35, priority: 3 },
          { category: "Video", minPercentage: 10, maxPercentage: 30, priority: 4 },
          { category: "Gaming", minPercentage: 10, maxPercentage: 30, priority: 5 },
        ],
      },
      {
        id: "aggressive",
        name: "Aggressive",
        description: "Focus on high-growth, trending products with higher risk",
        type: "aggressive",
        riskTolerance: 70,
        targetReturn: 40,
        timeHorizon: "short",
        allocationRules: [
          { category: "Video", minPercentage: 20, maxPercentage: 40, priority: 1 },
          { category: "Gaming", minPercentage: 20, maxPercentage: 40, priority: 2 },
          { category: "Audio", minPercentage: 15, maxPercentage: 35, priority: 3 },
          { category: "Peripherals", minPercentage: 10, maxPercentage: 30, priority: 4 },
        ],
      },
    ];
  }

  /**
   * Initialize market data for products
   */
  async initializeForProducts(products: Product[]) {
    for (const product of products) {
      const analysis = await this.generateMarketAnalysis(product);
      this.marketDataCache.set(product.id, analysis);
    }
    this.notifySubscribers();
  }

  /**
   * Clear market data cache
   */
  clearCache() {
    this.marketDataCache.clear();
  }
}

export default MarketDataService;
