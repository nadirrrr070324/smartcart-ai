import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useMemo,
  ReactNode,
} from "react";
import { Product, Scenario, Page, OptimizationResult, SortOption, MarketAnalysis, TradingStrategy, RealTimeMarketData, PriceAlert, Notification, WishlistItem } from "../types";
import { defaultProducts, defaultScenarios } from "../data/products";
import { optimizeCart, generateId } from "../utils/optimization";
import MarketDataService from "../services/marketDataService";
import AlertsService from "../services/alertsService";

export type RgbIntensity = "vivid" | "subtle" | "off";

const PREFS_KEY = "smartcart:prefs";

interface StoredPrefs {
  isDarkMode?: boolean;
  rgb?: RgbIntensity;
  reducedMotion?: boolean;
}

function loadPrefs(): Required<StoredPrefs> {
  const fallback = { isDarkMode: false, rgb: "vivid" as RgbIntensity, reducedMotion: false };
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(PREFS_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as StoredPrefs;
    return {
      isDarkMode: parsed.isDarkMode ?? fallback.isDarkMode,
      rgb: parsed.rgb ?? fallback.rgb,
      reducedMotion: parsed.reducedMotion ?? fallback.reducedMotion,
    };
  } catch {
    return fallback;
  }
}

interface AppState {
  page: Page;
  setPage: (page: Page) => void;
  products: Product[];
  addProduct: (product: Omit<Product, "id">) => void;
  updateProduct: (id: string, product: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  budget: number;
  setBudget: (budget: number) => void;
  selectedIds: string[];
  toggleSelection: (id: string) => void;
  selectAll: () => void;
  clearSelection: () => void;
  optimizationResult: OptimizationResult | null;
  runOptimization: () => void;
  scenarios: Scenario[];
  saveScenario: (name: string) => void;
  deleteScenario: (id: string) => void;
  duplicateScenario: (id: string) => void;
  renameScenario: (id: string, name: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  sortOption: SortOption;
  setSortOption: (option: SortOption) => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  rgbIntensity: RgbIntensity;
  setRgbIntensity: (intensity: RgbIntensity) => void;
  cycleRgbIntensity: () => void;
  reducedMotion: boolean;
  setReducedMotion: (value: boolean) => void;
  filteredProducts: Product[];
  availableProducts: Product[];
  marketData: Map<string, MarketAnalysis>;
  realTimeMarketData: RealTimeMarketData | null;
  selectedStrategy: TradingStrategy | null;
  setSelectedStrategy: (strategy: TradingStrategy | null) => void;
  refreshMarketData: () => Promise<void>;
  applyMarketStrategy: () => void;
  getMarketAnalysis: (productId: string) => MarketAnalysis | undefined;
  availableStrategies: TradingStrategy[];
  // Alerts & Notifications
  priceAlerts: PriceAlert[];
  createPriceAlert: (productId: string, targetPrice: number, condition?: "below" | "above" | "equals") => void;
  deletePriceAlert: (alertId: string) => void;
  /** Re-evaluates every untriggered alert against live prices; returns how many fired. */
  checkPriceAlerts: () => number;
  notifications: Notification[];
  markNotificationAsRead: (notificationId: string) => void;
  markAllNotificationsAsRead: () => void;
  deleteNotification: (notificationId: string) => void;
  unreadNotificationCount: number;
  // Wishlist
  wishlist: WishlistItem[];
  addToWishlist: (productId: string, notes?: string, priority?: "low" | "medium" | "high") => void;
  removeFromWishlist: (itemId: string) => void;
  removeFromWishlistByProductId: (productId: string) => void;
  isInWishlist: (productId: string) => boolean;
}

const AppContext = createContext<AppState | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const initialPrefs = useMemo(loadPrefs, []);
  const marketService = useMemo(() => MarketDataService.getInstance(), []);
  const alertsService = useMemo(() => AlertsService.getInstance(), []);

  const [page, setPage] = useState<Page>("dashboard");
  const [products, setProducts] = useState<Product[]>(defaultProducts);
  const [scenarios, setScenarios] = useState<Scenario[]>(defaultScenarios);
  const [budget, setBudget] = useState<number>(1000);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [optimizationResult, setOptimizationResult] = useState<OptimizationResult | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOption, setSortOption] = useState<SortOption>("ratio-desc");
  const [isDarkMode, setIsDarkMode] = useState<boolean>(initialPrefs.isDarkMode);
  const [rgbIntensity, setRgbIntensity] = useState<RgbIntensity>(initialPrefs.rgb);
  const [reducedMotion, setReducedMotion] = useState<boolean>(initialPrefs.reducedMotion);
  const [marketData, setMarketData] = useState<Map<string, MarketAnalysis>>(new Map());
  const [realTimeMarketData, setRealTimeMarketData] = useState<RealTimeMarketData | null>(null);
  const [selectedStrategy, setSelectedStrategy] = useState<TradingStrategy | null>(null);
  const [priceAlerts, setPriceAlerts] = useState<PriceAlert[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);

  // Initialize market data on mount
  useEffect(() => {
    marketService.initializeForProducts(products);
  }, []);

  // Subscribe to real-time market data updates
  useEffect(() => {
    const unsubscribe = marketService.subscribe((data) => {
      setRealTimeMarketData(data);
      setMarketData(new Map(data.products));
    });
    return unsubscribe;
  }, [marketService]);

  // Load alerts data
  useEffect(() => {
    setPriceAlerts(alertsService.getPriceAlerts());
    setNotifications(alertsService.getNotifications());
    setWishlist(alertsService.getWishlist());
  }, [alertsService]);

  /**
   * The document element is the single source of truth for the visual
   * settings so the CSS engine can react without prop drilling.
   */
  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", isDarkMode);
    root.dataset.rgb = rgbIntensity;
    if (reducedMotion) {
      root.dataset.motion = "off";
    } else {
      delete root.dataset.motion;
    }
  }, [isDarkMode, rgbIntensity, reducedMotion]);

  useEffect(() => {
    try {
      window.localStorage.setItem(
        PREFS_KEY,
        JSON.stringify({ isDarkMode, rgb: rgbIntensity, reducedMotion })
      );
    } catch {
      /* storage unavailable (private mode / quota) — preferences stay in memory */
    }
  }, [isDarkMode, rgbIntensity, reducedMotion]);

  const filteredProducts = useMemo(() => {
    let result = [...products];
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.category?.toLowerCase().includes(query)
      );
    }
    result.sort((a, b) => {
      switch (sortOption) {
        case "name":
          return a.name.localeCompare(b.name);
        case "price-asc":
          return a.price - b.price;
        case "price-desc":
          return b.price - a.price;
        case "utility-desc":
          return b.utility - a.utility;
        case "ratio-desc":
          return b.utility / b.price - a.utility / a.price;
        default:
          return 0;
      }
    });
    return result;
  }, [products, searchQuery, sortOption]);

  const availableProducts = useMemo(
    () => products.filter((p) => p.price <= budget),
    [products, budget]
  );

  const addProduct = useCallback((product: Omit<Product, "id">) => {
    setProducts((prev) => [...prev, { ...product, id: generateId() }]);
  }, []);

  const updateProduct = useCallback((id: string, updates: Partial<Product>) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updates } : p))
    );
  }, []);

  const deleteProduct = useCallback((id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
    setSelectedIds((prev) => prev.filter((sid) => sid !== id));
  }, []);

  const toggleSelection = useCallback((id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((sid) => sid !== id) : [...prev, id]
    );
  }, []);

  const selectAll = useCallback(() => {
    setSelectedIds(products.map((p) => p.id));
  }, [products]);

  const clearSelection = useCallback(() => {
    setSelectedIds([]);
  }, []);

  const runOptimization = useCallback(() => {
    const selected = products.filter((p) => selectedIds.includes(p.id));
    const result = optimizeCart(selected, budget);
    setOptimizationResult(result);
  }, [products, selectedIds, budget]);

  const saveScenario = useCallback(
    (name: string) => {
      const selected = products.filter((p) => selectedIds.includes(p.id));
      const result = optimizeCart(selected, budget);
      setScenarios((prev) => [
        {
          id: generateId(),
          name,
          budget,
          utility: result.totalUtility,
          products: selected,
          updatedAt: new Date(),
        },
        ...prev,
      ]);
    },
    [products, selectedIds, budget]
  );

  const deleteScenario = useCallback((id: string) => {
    setScenarios((prev) => prev.filter((s) => s.id !== id));
  }, []);

  const duplicateScenario = useCallback((id: string) => {
    setScenarios((prev) => {
      const scenario = prev.find((s) => s.id === id);
      if (!scenario) return prev;
      return [
        {
          ...scenario,
          id: generateId(),
          name: `${scenario.name} (Copy)`,
          updatedAt: new Date(),
        },
        ...prev,
      ];
    });
  }, []);

  const renameScenario = useCallback((id: string, name: string) => {
    setScenarios((prev) =>
      prev.map((s) => (s.id === id ? { ...s, name, updatedAt: new Date() } : s))
    );
  }, []);

  const refreshMarketData = useCallback(async () => {
    await marketService.initializeForProducts(products);
  }, [marketService, products]);

  const applyMarketStrategy = useCallback(() => {
    if (!selectedStrategy) return;
    const selected = marketService.applyTradingStrategy(products, selectedStrategy, marketData);
    setSelectedIds(selected.map((p) => p.id));
  }, [selectedStrategy, products, marketData, marketService]);

  const getMarketAnalysis = useCallback((productId: string) => {
    return marketData.get(productId);
  }, [marketData]);

  const availableStrategies = useMemo(() => marketService.getPredefinedStrategies(), [marketService]);

  // Alerts & Notifications
  const createPriceAlert = useCallback((productId: string, targetPrice: number, condition: "below" | "above" | "equals" = "below") => {
    alertsService.createPriceAlert(productId, targetPrice, condition);
    setPriceAlerts(alertsService.getPriceAlerts());
  }, [alertsService]);

  const deletePriceAlert = useCallback((alertId: string) => {
    alertsService.deletePriceAlert(alertId);
    setPriceAlerts(alertsService.getPriceAlerts());
  }, [alertsService]);

  const checkPriceAlerts = useCallback(() => {
    // Prefer live market prices, falling back to the listed price when the
    // product has no market analysis yet.
    const currentPrices = new Map<string, number>();
    products.forEach((product) => {
      currentPrices.set(
        product.id,
        marketData.get(product.id)?.price.currentPrice ?? product.price
      );
    });

    const triggered = alertsService.checkAlerts(currentPrices);
    if (triggered.length > 0) {
      setPriceAlerts(alertsService.getPriceAlerts());
      setNotifications(alertsService.getNotifications());
    }
    return triggered.length;
  }, [alertsService, products, marketData]);

  const markNotificationAsRead = useCallback((notificationId: string) => {
    alertsService.markNotificationAsRead(notificationId);
    setNotifications(alertsService.getNotifications());
  }, [alertsService]);

  const markAllNotificationsAsRead = useCallback(() => {
    alertsService.markAllNotificationsAsRead();
    setNotifications(alertsService.getNotifications());
  }, [alertsService]);

  const deleteNotification = useCallback((notificationId: string) => {
    alertsService.deleteNotification(notificationId);
    setNotifications(alertsService.getNotifications());
  }, [alertsService]);

  const unreadNotificationCount = useMemo(() => {
    return notifications.filter((n) => !n.read).length;
  }, [notifications]);

  // Wishlist
  const addToWishlist = useCallback((productId: string, notes?: string, priority: "low" | "medium" | "high" = "medium") => {
    alertsService.addToWishlist(productId, notes, priority);
    setWishlist(alertsService.getWishlist());
  }, [alertsService]);

  const removeFromWishlist = useCallback((itemId: string) => {
    alertsService.removeFromWishlist(itemId);
    setWishlist(alertsService.getWishlist());
  }, [alertsService]);

  const removeFromWishlistByProductId = useCallback((productId: string) => {
    alertsService.removeFromWishlistByProductId(productId);
    setWishlist(alertsService.getWishlist());
  }, [alertsService]);

  const isInWishlist = useCallback((productId: string) => {
    return alertsService.isInWishlist(productId);
  }, [alertsService]);

  const toggleDarkMode = useCallback(() => {
    setIsDarkMode((prev) => !prev);
  }, []);

  const cycleRgbIntensity = useCallback(() => {
    setRgbIntensity((prev) => {
      const order: RgbIntensity[] = ["vivid", "subtle", "off"];
      return order[(order.indexOf(prev) + 1) % order.length];
    });
  }, []);

  const value: AppState = {
    page,
    setPage,
    products,
    addProduct,
    updateProduct,
    deleteProduct,
    budget,
    setBudget,
    selectedIds,
    toggleSelection,
    selectAll,
    clearSelection,
    optimizationResult,
    runOptimization,
    scenarios,
    saveScenario,
    deleteScenario,
    duplicateScenario,
    renameScenario,
    searchQuery,
    setSearchQuery,
    sortOption,
    setSortOption,
    isDarkMode,
    toggleDarkMode,
    rgbIntensity,
    setRgbIntensity,
    cycleRgbIntensity,
    reducedMotion,
    setReducedMotion,
    filteredProducts,
    availableProducts,
    marketData,
    realTimeMarketData,
    selectedStrategy,
    setSelectedStrategy,
    refreshMarketData,
    applyMarketStrategy,
    getMarketAnalysis,
    availableStrategies,
    priceAlerts,
    createPriceAlert,
    deletePriceAlert,
    checkPriceAlerts,
    notifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    deleteNotification,
    unreadNotificationCount,
    wishlist,
    addToWishlist,
    removeFromWishlist,
    removeFromWishlistByProductId,
    isInWishlist,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
}
