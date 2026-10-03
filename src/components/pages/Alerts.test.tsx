import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { Product } from "../../types";

const ctx = vi.hoisted(() => ({
  products: [] as Product[],
  priceAlerts: [] as unknown[],
  createPriceAlert: vi.fn(),
  deletePriceAlert: vi.fn(),
  notifications: [] as unknown[],
  markNotificationAsRead: vi.fn(),
  markAllNotificationsAsRead: vi.fn(),
  deleteNotification: vi.fn(),
  unreadNotificationCount: 0,
  checkPriceAlerts: vi.fn(() => 0),
  getMarketAnalysis: vi.fn((): any => undefined),
  setPage: vi.fn(),
}));

vi.mock("../../context/AppContext", () => ({
  useApp: () => ctx,
}));

const { Alerts } = await import("./Alerts");

const products = [
  { id: "p1", name: "Basmati Rice", brand: "Daawat", category: "Grocery", price: 420, rating: 4.4 },
  { id: "p2", name: "Cold Pressed Oil", brand: "Nature Fresh", category: "Grocery", price: 310, rating: 4.1 },
] as unknown as Product[];

const alert = (over: Record<string, unknown> = {}) => ({
  id: "a1",
  productId: "p1",
  targetPrice: 300,
  condition: "below",
  isTriggered: false,
  triggeredAt: null,
  createdAt: new Date().toISOString(),
  ...over,
});

beforeEach(() => {
  ctx.products = products;
  ctx.priceAlerts = [alert()];
  ctx.notifications = [];
  ctx.unreadNotificationCount = 0;
  ctx.checkPriceAlerts.mockReturnValue(0);
  ctx.getMarketAnalysis.mockReturnValue(undefined);
  for (const key of [
    "createPriceAlert",
    "deletePriceAlert",
    "markNotificationAsRead",
    "markAllNotificationsAsRead",
    "deleteNotification",
    "setPage",
  ] as const) {
    ctx[key].mockClear();
  }
});

describe("Alerts page", () => {
  it("renders both tabs with the alerts tab active first", () => {
    render(<Alerts />);

    expect(screen.getByRole("button", { name: /Price Alerts/i })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
    expect(screen.getByRole("button", { name: /Notifications/i })).toHaveAttribute(
      "aria-pressed",
      "false"
    );
  });

  it("lists an active alert with its product name", () => {
    render(<Alerts />);

    expect(screen.getByText("Basmati Rice")).toBeInTheDocument();
  });

  it("separates triggered alerts from active ones", () => {
    ctx.priceAlerts = [alert(), alert({ id: "a2", isTriggered: true, triggeredAt: new Date() })];
    render(<Alerts />);

    // Both products resolve, but only one row is rendered per alert.
    expect(screen.getAllByText("Basmati Rice")).toHaveLength(2);
  });

  it("shows the empty state when there are no alerts", () => {
    ctx.priceAlerts = [];
    render(<Alerts />);

    expect(screen.getByText("No price alerts yet")).toBeInTheDocument();
  });

  it("tolerates an alert whose product is missing from the catalogue", () => {
    ctx.priceAlerts = [alert({ productId: "gone" })];
    render(<Alerts />);

    expect(screen.getByText(/No category/)).toBeInTheDocument();
  });

  it("deletes an alert by id", async () => {
    render(<Alerts />);

    await userEvent.click(screen.getByRole("button", { name: /Delete alert/i }));

    expect(ctx.deletePriceAlert).toHaveBeenCalledWith("a1");
  });

  it("prefers the live market price over the catalogue price", () => {
    ctx.getMarketAnalysis.mockReturnValue({ price: { currentPrice: 399 } });
    render(<Alerts />);

    expect(screen.getByText(/399/)).toBeInTheDocument();
  });

  it("disables Check Alerts when there are no alerts", () => {
    ctx.priceAlerts = [];
    render(<Alerts />);

    expect(screen.getByRole("button", { name: /Check Alerts/i })).toBeDisabled();
  });

  it("reports that nothing triggered", async () => {
    render(<Alerts />);

    await userEvent.click(screen.getByRole("button", { name: /Check Alerts/i }));

    expect(ctx.checkPriceAlerts).toHaveBeenCalled();
    expect(screen.getByText(/No alerts met their target yet/)).toBeInTheDocument();
  });

  it("uses singular wording for exactly one triggered alert", async () => {
    ctx.checkPriceAlerts.mockReturnValue(1);
    render(<Alerts />);

    await userEvent.click(screen.getByRole("button", { name: /Check Alerts/i }));

    expect(screen.getByText("1 alert just triggered.")).toBeInTheDocument();
  });

  it("uses plural wording for several triggered alerts", async () => {
    ctx.checkPriceAlerts.mockReturnValue(3);
    render(<Alerts />);

    await userEvent.click(screen.getByRole("button", { name: /Check Alerts/i }));

    expect(screen.getByText("3 alerts just triggered.")).toBeInTheDocument();
  });
});

describe("create alert modal", () => {
  it("opens prefilled with the first product and its price", async () => {
    render(<Alerts />);

    await userEvent.click(screen.getByRole("button", { name: /New Alert/i }));

    await waitFor(() => expect(screen.getByDisplayValue("420")).toBeInTheDocument());
  });

  it("disables New Alert when the catalogue is empty", () => {
    ctx.products = [];
    render(<Alerts />);

    expect(screen.getByRole("button", { name: /New Alert/i })).toBeDisabled();
  });

  it("creates an alert for the entered target price", async () => {
    render(<Alerts />);

    await userEvent.click(screen.getByRole("button", { name: /New Alert/i }));
    const field = await screen.findByDisplayValue("420");
    await userEvent.clear(field);
    await userEvent.type(field, "275");
    await userEvent.click(screen.getByRole("button", { name: /^Create Alert$/i }));

    expect(ctx.createPriceAlert).toHaveBeenCalledWith("p1", 275, "below");
  });

  it("rejects a zero target price", async () => {
    render(<Alerts />);

    await userEvent.click(screen.getByRole("button", { name: /New Alert/i }));
    const field = await screen.findByDisplayValue("420");
    await userEvent.clear(field);
    await userEvent.type(field, "0");
    await userEvent.click(screen.getByRole("button", { name: /^Create Alert$/i }));

    expect(
      await screen.findByText("Enter a target price greater than zero.")
    ).toBeInTheDocument();
    expect(ctx.createPriceAlert).not.toHaveBeenCalled();
  });

  it("rejects a negative target price", async () => {
    render(<Alerts />);

    await userEvent.click(screen.getByRole("button", { name: /New Alert/i }));
    const field = await screen.findByDisplayValue("420");
    await userEvent.clear(field);
    await userEvent.type(field, "-50");
    await userEvent.click(screen.getByRole("button", { name: /^Create Alert$/i }));

    expect(
      await screen.findByText("Enter a target price greater than zero.")
    ).toBeInTheDocument();
    expect(ctx.createPriceAlert).not.toHaveBeenCalled();
  });

  it("blocks an exact duplicate alert", async () => {
    render(<Alerts />);

    await userEvent.click(screen.getByRole("button", { name: /New Alert/i }));
    const field = await screen.findByDisplayValue("420");
    await userEvent.clear(field);
    await userEvent.type(field, "300");
    await userEvent.click(screen.getByRole("button", { name: /^Create Alert$/i }));

    expect(await screen.findByText("That exact alert already exists.")).toBeInTheDocument();
    expect(ctx.createPriceAlert).not.toHaveBeenCalled();
  });

  it("allows the same product at a different target price", async () => {
    render(<Alerts />);

    await userEvent.click(screen.getByRole("button", { name: /New Alert/i }));
    const field = await screen.findByDisplayValue("420");
    await userEvent.clear(field);
    await userEvent.type(field, "350");
    await userEvent.click(screen.getByRole("button", { name: /^Create Alert$/i }));

    expect(ctx.createPriceAlert).toHaveBeenCalledWith("p1", 350, "below");
  });

  it("passes the chosen condition through", async () => {
    render(<Alerts />);

    await userEvent.click(screen.getByRole("button", { name: /New Alert/i }));
    const field = await screen.findByDisplayValue("420");
    await userEvent.clear(field);
    await userEvent.type(field, "600");
    await userEvent.click(screen.getByRole("button", { name: /Rises above/i }));
    await userEvent.click(screen.getByRole("button", { name: /^Create Alert$/i }));

    expect(ctx.createPriceAlert).toHaveBeenCalledWith("p1", 600, "above");
  });

  it("closes without creating when cancelled", async () => {
    render(<Alerts />);

    await userEvent.click(screen.getByRole("button", { name: /New Alert/i }));
    await screen.findByDisplayValue("420");
    await userEvent.click(screen.getByRole("button", { name: /Cancel/i }));

    await waitFor(() => expect(screen.queryByDisplayValue("420")).not.toBeInTheDocument());
    expect(ctx.createPriceAlert).not.toHaveBeenCalled();
  });
});

describe("notifications tab", () => {
  const notification = (over: Record<string, unknown> = {}) => ({
    id: "n1",
    type: "system",
    title: "Delivery update",
    message: "Your order shipped.",
    read: false,
    createdAt: new Date().toISOString(),
    ...over,
  });

  it("shows an empty state when there is nothing to review", async () => {
    render(<Alerts />);

    await userEvent.click(screen.getByRole("button", { name: /Notifications/i }));

    expect(screen.getByText("You're all caught up")).toBeInTheDocument();
  });

  it("lists a notification", async () => {
    ctx.notifications = [notification()];
    render(<Alerts />);

    await userEvent.click(screen.getByRole("button", { name: /Notifications/i }));

    expect(screen.getByText("Delivery update")).toBeInTheDocument();
    expect(screen.getByText("Your order shipped.")).toBeInTheDocument();
  });

  it("marks one notification read by its title", async () => {
    ctx.notifications = [notification()];
    render(<Alerts />);

    await userEvent.click(screen.getByRole("button", { name: /Notifications/i }));
    await userEvent.click(
      screen.getByRole("button", { name: 'Mark "Delivery update" as read' })
    );

    expect(ctx.markNotificationAsRead).toHaveBeenCalledWith("n1");
  });

  it("deletes a notification by its title", async () => {
    ctx.notifications = [notification()];
    render(<Alerts />);

    await userEvent.click(screen.getByRole("button", { name: /Notifications/i }));
    await userEvent.click(screen.getByRole("button", { name: 'Delete "Delivery update"' }));

    expect(ctx.deleteNotification).toHaveBeenCalledWith("n1");
  });

  it("marks everything read", async () => {
    ctx.notifications = [notification(), notification({ id: "n2", title: "Offer" })];
    ctx.unreadNotificationCount = 2;
    render(<Alerts />);

    await userEvent.click(screen.getByRole("button", { name: /Notifications/i }));
    await userEvent.click(screen.getByRole("button", { name: /Mark all as read/i }));

    expect(ctx.markAllNotificationsAsRead).toHaveBeenCalled();
  });

  it("hides the mark-all control when nothing is unread", async () => {
    ctx.notifications = [notification({ read: true })];
    ctx.unreadNotificationCount = 0;
    render(<Alerts />);

    await userEvent.click(screen.getByRole("button", { name: /Notifications/i }));

    expect(
      screen.queryByRole("button", { name: /Mark all as read/i })
    ).not.toBeInTheDocument();
  });

  it("marks an unread notification", async () => {
    ctx.notifications = [notification()];
    render(<Alerts />);

    await userEvent.click(screen.getByRole("button", { name: /Notifications/i }));

    expect(screen.getAllByLabelText("Unread")).toHaveLength(1);
  });

  it("does not mark a read notification as unread", async () => {
    ctx.notifications = [notification({ read: true })];
    render(<Alerts />);

    await userEvent.click(screen.getByRole("button", { name: /Notifications/i }));

    expect(screen.queryByLabelText("Unread")).not.toBeInTheDocument();
  });
});