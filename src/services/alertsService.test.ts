import { beforeEach, describe, expect, it, vi } from "vitest";
import AlertsService from "./alertsService";

const service = AlertsService.getInstance();

/**
 * Drops the cached singleton so the next getInstance() re-runs loadFromStorage,
 * which is the only way to exercise deserialisation from localStorage.
 */
function resetSingleton() {
  (AlertsService as unknown as { instance: AlertsService | undefined }).instance = undefined;
  return AlertsService.getInstance();
}

/** Wipes the singleton between tests without needing to reset the class. */
beforeEach(() => {
  service.clearAll();
});

describe("price alerts", () => {
  it("creates an untriggered alert with the current timestamp", () => {
    const alert = service.createPriceAlert("p1", 250);

    expect(alert.id).toBeTruthy();
    expect(alert.productId).toBe("p1");
    expect(alert.targetPrice).toBe(250);
    expect(alert.condition).toBe("below");
    expect(alert.isTriggered).toBe(false);
    expect(alert.triggeredAt).toBeNull();
    expect(alert.createdAt).toBeInstanceOf(Date);
  });

  it("honours an explicit condition", () => {
    const alert = service.createPriceAlert("p1", 250, "above");

    expect(alert.condition).toBe("above");
  });

  it("filters by product id", () => {
    service.createPriceAlert("p1", 100);
    service.createPriceAlert("p2", 200);
    service.createPriceAlert("p1", 300);

    expect(service.getPriceAlerts()).toHaveLength(3);
    expect(service.getPriceAlerts("p1")).toHaveLength(2);
    expect(service.getPriceAlerts("missing")).toHaveLength(0);
  });

  it("deletes an alert", () => {
    const alert = service.createPriceAlert("p1", 100);

    service.deletePriceAlert(alert.id);

    expect(service.getPriceAlerts()).toHaveLength(0);
  });

  it("persists alerts to localStorage", () => {
    service.createPriceAlert("p1", 100, "below");

    const stored = window.localStorage.getItem("smartcart:alerts");

    expect(stored).toBeTruthy();
    expect(JSON.parse(stored!)).toHaveLength(1);
  });
});

describe("checkAlerts", () => {
  it("triggers a 'below' alert when the price reaches the target", () => {
    service.createPriceAlert("p1", 250, "below");

    const fired = service.checkAlerts(new Map([["p1", 250]]));

    expect(fired).toHaveLength(1);
    expect(fired[0].type).toBe("price_alert");
    expect(fired[0].productId).toBe("p1");
    expect(fired[0].read).toBe(false);
    expect(service.getPriceAlerts()[0].isTriggered).toBe(true);
    expect(service.getPriceAlerts()[0].triggeredAt).toBeInstanceOf(Date);
  });

  it("does not trigger while the price stays above the target", () => {
    service.createPriceAlert("p1", 250, "below");

    const fired = service.checkAlerts(new Map([["p1", 300]]));

    expect(fired).toHaveLength(0);
    expect(service.getPriceAlerts()[0].isTriggered).toBe(false);
  });

  it("triggers an 'above' alert when the price rises past the target", () => {
    service.createPriceAlert("p1", 250, "above");

    expect(service.checkAlerts(new Map([["p1", 260]]))).toHaveLength(1);
    expect(service.checkAlerts(new Map([["p1", 240]]))).toHaveLength(0);
  });

  it("only triggers an 'equals' alert on an exact match", () => {
    service.createPriceAlert("p1", 250, "equals");

    expect(service.checkAlerts(new Map([["p1", 249]]))).toHaveLength(0);
    expect(service.checkAlerts(new Map([["p1", 250]]))).toHaveLength(1);
  });

  it("treats a price of zero as a real price", () => {
    service.createPriceAlert("p1", 100, "below");

    // 0 must not be mistaken for "no price available".
    expect(service.checkAlerts(new Map([["p1", 0]]))).toHaveLength(1);
  });

  it("fires each alert only once", () => {
    service.createPriceAlert("p1", 250, "below");

    expect(service.checkAlerts(new Map([["p1", 200]]))).toHaveLength(1);
    expect(service.checkAlerts(new Map([["p1", 150]]))).toHaveLength(0);
  });

  it("ignores alerts for products missing from the price map", () => {
    service.createPriceAlert("p1", 250, "below");

    expect(service.checkAlerts(new Map())).toHaveLength(0);
  });

  it("reports every triggered alert in one pass", () => {
    service.createPriceAlert("p1", 100, "below");
    service.createPriceAlert("p2", 200, "below");
    service.createPriceAlert("p3", 900, "below");

    const fired = service.checkAlerts(new Map([["p1", 90], ["p2", 150]]));

    expect(fired).toHaveLength(2);
    expect(fired.map((n) => n.productId).sort()).toEqual(["p1", "p2"]);
  });

  it("puts the price and target into the notification message", () => {
    service.createPriceAlert("p1", 250, "below");

    const [notification] = service.checkAlerts(new Map([["p1", 240]]));

    expect(notification.message).toContain("240");
    expect(notification.message).toContain("250");
  });
});

describe("notifications", () => {
  it("returns an empty list to start with", () => {
    expect(service.getNotifications()).toHaveLength(0);
    expect(service.getUnreadCount()).toBe(0);
  });

  it("adds a system notification at the front", () => {
    service.addSystemNotification("Heads up", "Something happened");

    const [notification] = service.getNotifications();

    expect(notification.type).toBe("system");
    expect(notification.title).toBe("Heads up");
    expect(notification.read).toBe(false);
  });

  it("marks one notification as read", () => {
    const created = service.addSystemNotification("A", "a");
    service.addSystemNotification("B", "b");

    service.markNotificationAsRead(created.id);

    expect(service.getUnreadCount()).toBe(1);
  });

  it("marks every notification as read", () => {
    service.addSystemNotification("A", "a");
    service.addSystemNotification("B", "b");

    service.markAllNotificationsAsRead();

    expect(service.getUnreadCount()).toBe(0);
  });

  it("deletes a notification", () => {
    const created = service.addSystemNotification("A", "a");

    service.deleteNotification(created.id);

    expect(service.getNotifications()).toHaveLength(0);
  });

  it("ignores a mark-read for an unknown id", () => {
    service.addSystemNotification("A", "a");

    expect(() => service.markNotificationAsRead("nope")).not.toThrow();
    expect(service.getUnreadCount()).toBe(1);
  });

  it("orders notifications newest first", () => {
    service.addSystemNotification("new", "n");

    // Rewrite the stored list with an older entry, then re-read it.
    const stored = JSON.parse(window.localStorage.getItem("smartcart:notifications")!);
    stored.push({
      id: "old",
      type: "system",
      title: "old",
      message: "o",
      read: false,
      createdAt: new Date(Date.now() - 60_000).toISOString(),
    });
    window.localStorage.setItem("smartcart:notifications", JSON.stringify(stored));

    const notifications = resetSingleton().getNotifications();

    expect(notifications.map((n) => n.title)).toEqual(["new", "old"]);
  });
});

describe("wishlist", () => {
  it("adds an item with a default priority", () => {
    const item = service.addToWishlist("p1");

    expect(item.productId).toBe("p1");
    expect(item.priority).toBe("medium");
    expect(item.addedAt).toBeInstanceOf(Date);
    expect(service.isInWishlist("p1")).toBe(true);
  });

  it("sorts by priority, highest first", () => {
    service.addToWishlist("low", undefined, "low");
    service.addToWishlist("high", undefined, "high");
    service.addToWishlist("medium", undefined, "medium");

    expect(service.getWishlist().map((w) => w.productId)).toEqual([
      "high",
      "medium",
      "low",
    ]);
  });

  it("removes by item id and by product id", () => {
    const first = service.addToWishlist("p1");
    service.addToWishlist("p2");

    service.removeFromWishlist(first.id);
    expect(service.getWishlist()).toHaveLength(1);

    service.removeFromWishlistByProductId("p2");
    expect(service.getWishlist()).toHaveLength(0);
  });

  it("does nothing when removing an unknown product", () => {
    service.addToWishlist("p1");

    expect(() => service.removeFromWishlistByProductId("missing")).not.toThrow();
    expect(service.getWishlist()).toHaveLength(1);
  });

  it("updates notes and priority", () => {
    const item = service.addToWishlist("p1");

    service.updateWishlistItem(item.id, { notes: "Birthday gift", priority: "high" });

    const [updated] = service.getWishlist();
    expect(updated.notes).toBe("Birthday gift");
    expect(updated.priority).toBe("high");
  });

  it("ignores updates for an unknown item", () => {
    service.addToWishlist("p1");

    expect(() => service.updateWishlistItem("nope", { priority: "high" })).not.toThrow();
    expect(service.getWishlist()[0].priority).toBe("medium");
  });

  it("reports membership per product", () => {
    service.addToWishlist("p1");

    expect(service.isInWishlist("p1")).toBe(true);
    expect(service.isInWishlist("p2")).toBe(false);
  });
});

describe("clearAll", () => {
  it("empties alerts, notifications and the wishlist", () => {
    service.createPriceAlert("p1", 100);
    service.addSystemNotification("A", "a");
    service.addToWishlist("p1");

    service.clearAll();

    expect(service.getPriceAlerts()).toHaveLength(0);
    expect(service.getNotifications()).toHaveLength(0);
    expect(service.getWishlist()).toHaveLength(0);
  });
});

describe("persistence", () => {
  it("rehydrates alerts with real Date objects", () => {
    service.createPriceAlert("p1", 100, "above");
    resetSingleton();

    const [alert] = AlertsService.getInstance().getPriceAlerts();

    expect(alert.productId).toBe("p1");
    expect(alert.condition).toBe("above");
    expect(alert.createdAt).toBeInstanceOf(Date);
    expect(alert.triggeredAt).toBeNull();
    expect(Number.isNaN(alert.createdAt.getTime())).toBe(false);
  });

  it("rehydrates a triggered alert with a real triggeredAt Date", () => {
    service.createPriceAlert("p1", 100);
    service.checkAlerts(new Map([["p1", 50]]));
    resetSingleton();

    const [alert] = AlertsService.getInstance().getPriceAlerts();

    expect(alert.isTriggered).toBe(true);
    expect(alert.triggeredAt).toBeInstanceOf(Date);
  });

  it("rehydrates the wishlist and notifications", () => {
    service.addToWishlist("p1", "note", "high");
    service.addSystemNotification("A", "a");
    resetSingleton();

    const fresh = AlertsService.getInstance();

    expect(fresh.getWishlist()[0].notes).toBe("note");
    expect(fresh.getWishlist()[0].addedAt).toBeInstanceOf(Date);
    expect(fresh.getNotifications()[0].title).toBe("A");
    expect(fresh.getNotifications()[0].createdAt).toBeInstanceOf(Date);
  });

  it("survives malformed JSON in localStorage", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    window.localStorage.setItem("smartcart:alerts", "{not json");

    const fresh = resetSingleton();

    expect(fresh.getPriceAlerts()).toHaveLength(0);
    spy.mockRestore();
  });

  it("keeps working in memory when localStorage throws", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const setItem = vi
      .spyOn(Storage.prototype, "setItem")
      .mockImplementation(() => {
        throw new Error("quota exceeded");
      });

    expect(() => service.createPriceAlert("p1", 100)).not.toThrow();
    expect(service.getPriceAlerts()).toHaveLength(1);

    setItem.mockRestore();
    spy.mockRestore();
  });
});