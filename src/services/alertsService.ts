import { PriceAlert, Notification, WishlistItem } from "../types/alerts";
import { generateId } from "../utils/optimization";

/**
 * Alerts Service
 * Manages price alerts, notifications and the wishlist.
 *
 * Historical price series and the retailer catalogue are owned by
 * priceHistoryService / retailerService — nothing here recorded history, so the
 * old getHistoricalPriceData() could only ever return null.
 */
class AlertsService {
  private static instance: AlertsService;
  private alerts: Map<string, PriceAlert> = new Map();
  private notifications: Notification[] = [];
  private wishlist: Map<string, WishlistItem> = new Map();

  private constructor() {
    this.loadFromStorage();
  }

  static getInstance(): AlertsService {
    if (!AlertsService.instance) {
      AlertsService.instance = new AlertsService();
    }
    return AlertsService.instance;
  }

  private loadFromStorage() {
    try {
      const alerts = localStorage.getItem("smartcart:alerts");
      const wishlist = localStorage.getItem("smartcart:wishlist");
      const notifications = localStorage.getItem("smartcart:notifications");

      if (alerts) {
        const parsed = JSON.parse(alerts);
        parsed.forEach((alert: PriceAlert) => {
          alert.createdAt = new Date(alert.createdAt);
          alert.triggeredAt = alert.triggeredAt ? new Date(alert.triggeredAt) : null;
          this.alerts.set(alert.id, alert);
        });
      }

      if (wishlist) {
        const parsed = JSON.parse(wishlist);
        parsed.forEach((item: WishlistItem) => {
          item.addedAt = new Date(item.addedAt);
          this.wishlist.set(item.id, item);
        });
      }

      if (notifications) {
        const parsed = JSON.parse(notifications);
        this.notifications = parsed.map((n: Notification) => ({
          ...n,
          createdAt: new Date(n.createdAt),
          expiresAt: n.expiresAt ? new Date(n.expiresAt) : undefined,
        }));
      }
    } catch (e) {
      console.error("Failed to load alerts from storage:", e);
    }
  }

  private saveToStorage() {
    try {
      localStorage.setItem("smartcart:alerts", JSON.stringify(Array.from(this.alerts.values())));
      localStorage.setItem("smartcart:wishlist", JSON.stringify(Array.from(this.wishlist.values())));
      localStorage.setItem("smartcart:notifications", JSON.stringify(this.notifications));
    } catch (e) {
      console.error("Failed to save alerts to storage:", e);
    }
  }

  // Price Alerts
  createPriceAlert(
    productId: string,
    targetPrice: number,
    condition: "below" | "above" | "equals" = "below"
  ): PriceAlert {
    const alert: PriceAlert = {
      id: generateId(),
      productId,
      targetPrice,
      condition,
      isTriggered: false,
      triggeredAt: null,
      createdAt: new Date(),
    };
    this.alerts.set(alert.id, alert);
    this.saveToStorage();
    return alert;
  }

  deletePriceAlert(alertId: string): void {
    this.alerts.delete(alertId);
    this.saveToStorage();
  }

  getPriceAlerts(productId?: string): PriceAlert[] {
    const alerts = Array.from(this.alerts.values());
    if (productId) {
      return alerts.filter((a) => a.productId === productId);
    }
    return alerts;
  }

  checkAlerts(currentPrices: Map<string, number>): Notification[] {
    const newNotifications: Notification[] = [];

    this.alerts.forEach((alert) => {
      if (alert.isTriggered) return;

      const currentPrice = currentPrices.get(alert.productId);
      // A price of 0 is a real price, so only absent values are skipped.
      if (currentPrice === undefined || currentPrice === null) return;

      let triggered = false;
      if (alert.condition === "below" && currentPrice <= alert.targetPrice) {
        triggered = true;
      } else if (alert.condition === "above" && currentPrice >= alert.targetPrice) {
        triggered = true;
      } else if (alert.condition === "equals" && currentPrice === alert.targetPrice) {
        triggered = true;
      }

      if (triggered) {
        alert.isTriggered = true;
        alert.triggeredAt = new Date();

        const notification: Notification = {
          id: generateId(),
          type: "price_alert",
          title: "Price Alert Triggered!",
          message: `Product price is now ${this.formatPrice(currentPrice)} (target: ${this.formatPrice(alert.targetPrice)})`,
          productId: alert.productId,
          read: false,
          createdAt: new Date(),
        };
        newNotifications.push(notification);
      }
    });

    if (newNotifications.length > 0) {
      this.notifications.unshift(...newNotifications);
      this.saveToStorage();
    }

    return newNotifications;
  }

  // Notifications
  getNotifications(): Notification[] {
    return this.notifications.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  markNotificationAsRead(notificationId: string): void {
    const notification = this.notifications.find((n) => n.id === notificationId);
    if (notification) {
      notification.read = true;
      this.saveToStorage();
    }
  }

  markAllNotificationsAsRead(): void {
    this.notifications.forEach((n) => (n.read = true));
    this.saveToStorage();
  }

  deleteNotification(notificationId: string): void {
    this.notifications = this.notifications.filter((n) => n.id !== notificationId);
    this.saveToStorage();
  }

  getUnreadCount(): number {
    return this.notifications.filter((n) => !n.read).length;
  }

  addSystemNotification(title: string, message: string): Notification {
    const notification: Notification = {
      id: generateId(),
      type: "system",
      title,
      message,
      read: false,
      createdAt: new Date(),
    };
    this.notifications.unshift(notification);
    this.saveToStorage();
    return notification;
  }

  // Wishlist
  addToWishlist(productId: string, notes?: string, priority: "low" | "medium" | "high" = "medium"): WishlistItem {
    const item: WishlistItem = {
      id: generateId(),
      productId,
      addedAt: new Date(),
      notes,
      priority,
    };
    this.wishlist.set(item.id, item);
    this.saveToStorage();
    return item;
  }

  removeFromWishlist(itemId: string): void {
    this.wishlist.delete(itemId);
    this.saveToStorage();
  }

  removeFromWishlistByProductId(productId: string): void {
    const item = Array.from(this.wishlist.values()).find((w) => w.productId === productId);
    if (item) {
      this.wishlist.delete(item.id);
      this.saveToStorage();
    }
  }

  getWishlist(): WishlistItem[] {
    return Array.from(this.wishlist.values()).sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }

  isInWishlist(productId: string): boolean {
    return Array.from(this.wishlist.values()).some((item) => item.productId === productId);
  }

  updateWishlistItem(itemId: string, updates: Partial<WishlistItem>): void {
    const item = this.wishlist.get(itemId);
    if (item) {
      Object.assign(item, updates);
      this.saveToStorage();
    }
  }

  // Utility
  private formatPrice(price: number): string {
    return `₹${price.toLocaleString("en-IN")}`;
  }

  // Clear all data
  clearAll(): void {
    this.alerts.clear();
    this.notifications = [];
    this.wishlist.clear();
    this.saveToStorage();
  }
}

export default AlertsService;
