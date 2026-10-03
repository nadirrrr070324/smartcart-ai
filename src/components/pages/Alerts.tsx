import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  BellOff,
  Check,
  CheckCheck,
  Plus,
  RefreshCw,
  Sparkles,
  Tag,
  Trash2,
  Info,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { useApp } from "../../context/AppContext";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";
import { Modal } from "../ui/Modal";
import { Badge } from "../ui/Badge";
import { EmptyState } from "../ui/EmptyState";
import { Input } from "../ui/Input";
import { ProgressBar } from "../ui/ProgressBar";
import { formatCurrency } from "../../utils/optimization";
import { ProductImage } from "../ui/ProductImage";
import { cn } from "../../utils/cn";
import type { Notification, PriceAlert } from "../../types/alerts";

type Tab = "alerts" | "notifications";
type AlertCondition = PriceAlert["condition"];

const TABS: { id: Tab; label: string; icon: LucideIcon }[] = [
  { id: "alerts", label: "Price Alerts", icon: Bell },
  { id: "notifications", label: "Notifications", icon: CheckCheck },
];

const CONDITIONS: { value: AlertCondition; label: string }[] = [
  { value: "below", label: "Drops below" },
  { value: "above", label: "Rises above" },
  { value: "equals", label: "Equals exactly" },
];

const CONDITION_LABEL: Record<AlertCondition, string> = {
  below: "Drops below",
  above: "Rises above",
  equals: "Equals",
};

const NOTIFICATION_META: Record<
  Notification["type"],
  { label: string; icon: LucideIcon; iconClass: string; tint: string }
> = {
  price_alert: {
    label: "Price alert",
    icon: Tag,
    iconClass: "text-[var(--success)] bg-[var(--success-subtle)]",
    tint: "border-l-[var(--success)]",
  },
  deal: {
    label: "Deal",
    icon: Zap,
    iconClass: "text-[var(--warning)] bg-[var(--warning-subtle)]",
    tint: "border-l-[var(--warning)]",
  },
  recommendation: {
    label: "Recommendation",
    icon: Sparkles,
    iconClass: "text-[var(--accent)] bg-[var(--accent-subtle)]",
    tint: "border-l-[var(--accent)]",
  },
  system: {
    label: "System",
    icon: Info,
    iconClass: "text-[var(--text-secondary)] bg-[var(--background)]",
    tint: "border-l-[var(--border-strong)]",
  },
};

function formatRelativeTime(value: Date): string {
  const then = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(then.getTime())) return "";

  const diffMs = Date.now() - then.getTime();
  const minutes = Math.round(diffMs / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.round(hours / 24);
  if (days < 30) return `${days}d ago`;

  return then.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

/**
 * How far the current market price has travelled towards the alert condition,
 * as a percentage. `below`/`equals` fill up as the price falls, `above` as it rises.
 */
function progressTowardTrigger(
  condition: AlertCondition,
  currentPrice: number,
  targetPrice: number
): number {
  if (currentPrice <= 0) return 0;

  let percent: number;
  if (condition === "below") {
    percent = (1 - targetPrice / currentPrice) * 100;
  } else if (condition === "above") {
    percent = (targetPrice / currentPrice) * 100;
  } else {
    percent = currentPrice === targetPrice ? 100 : 0;
  }

  return Math.min(100, Math.max(0, percent));
}

export function Alerts() {
  const {
    products,
    priceAlerts,
    createPriceAlert,
    deletePriceAlert,
    notifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    deleteNotification,
    unreadNotificationCount,
    checkPriceAlerts,
    getMarketAnalysis,
    setPage,
  } = useApp();

  const [tab, setTab] = useState<Tab>("alerts");
  const [modalOpen, setModalOpen] = useState(false);
  const [productId, setProductId] = useState("");
  const [targetPrice, setTargetPrice] = useState("");
  const [condition, setCondition] = useState<AlertCondition>("below");
  const [formError, setFormError] = useState<string | null>(null);
  const [checkStatus, setCheckStatus] = useState<string | null>(null);

  const activeAlerts = useMemo(
    () => priceAlerts.filter((alert) => !alert.isTriggered),
    [priceAlerts]
  );
  const triggeredAlerts = useMemo(
    () => priceAlerts.filter((alert) => alert.isTriggered),
    [priceAlerts]
  );

  const getCurrentPrice = (id: string, fallback: number) =>
    getMarketAnalysis(id)?.price.currentPrice ?? fallback;

  const openCreateModal = () => {
    setProductId(products[0]?.id ?? "");
    setTargetPrice(products[0] ? String(products[0].price) : "");
    setCondition("below");
    setFormError(null);
    setModalOpen(true);
  };

  const handleProductChange = (id: string) => {
    setProductId(id);
    const product = products.find((p) => p.id === id);
    if (product) setTargetPrice(String(getCurrentPrice(product.id, product.price)));
  };

  const handleCreateAlert = () => {
    if (!productId) {
      setFormError("Choose a product to watch.");
      return;
    }

    const parsed = Number(targetPrice);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      setFormError("Enter a target price greater than zero.");
      return;
    }

    const duplicate = priceAlerts.some(
      (alert) =>
        alert.productId === productId &&
        alert.condition === condition &&
        alert.targetPrice === parsed
    );
    if (duplicate) {
      setFormError("That exact alert already exists.");
      return;
    }

    createPriceAlert(productId, parsed, condition);
    setModalOpen(false);
    setFormError(null);
    setTab("alerts");
  };

  const handleCheckAlerts = () => {
    const triggeredCount = checkPriceAlerts();
    setCheckStatus(
      triggeredCount > 0
        ? `${triggeredCount} ${triggeredCount === 1 ? "alert" : "alerts"} just triggered.`
        : "No alerts met their target yet."
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-[var(--text-primary)] sm:text-3xl">
            <span className="rgb-text-soft">Alerts</span>
          </h1>
          <p className="mt-1 text-[var(--text-secondary)]">
            Track target prices and review your notifications.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="secondary"
            onClick={handleCheckAlerts}
            disabled={priceAlerts.length === 0}
          >
            <RefreshCw className="h-4 w-4" />
            Check Alerts
          </Button>
          <Button onClick={openCreateModal} disabled={products.length === 0}>
            <Plus className="h-4 w-4" />
            New Alert
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card padding="md" rgbBorder>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent-subtle)] text-[var(--accent)]">
              <Bell className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-[var(--text-muted)]">Active Alerts</p>
              <p className="font-display text-2xl font-bold text-[var(--text-primary)]">
                {activeAlerts.length}
              </p>
            </div>
          </div>
        </Card>
        <Card padding="md" rgbBorder>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--success-subtle)] text-[var(--success)]">
              <Check className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-[var(--text-muted)]">Triggered</p>
              <p className="font-display text-2xl font-bold text-[var(--text-primary)]">
                {triggeredAlerts.length}
              </p>
            </div>
          </div>
        </Card>
        <Card padding="md" rgbBorder>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--warning-subtle)] text-[var(--warning)]">
              <BellOff className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-[var(--text-muted)]">Unread</p>
              <p className="font-display text-2xl font-bold text-[var(--text-primary)]">
                {unreadNotificationCount}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {checkStatus && (
        <p
          role="status"
          className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-sm text-[var(--text-secondary)]"
        >
          {checkStatus}
        </p>
      )}

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-1">
        {TABS.map(({ id, label, icon: Icon }) => {
          const count = id === "alerts" ? activeAlerts.length : unreadNotificationCount;
          return (
            <button
              key={id}
              onClick={() => setTab(id)}
              aria-pressed={tab === id}
              className={cn(
                "relative flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                tab === id
                  ? "text-[var(--text-primary)]"
                  : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
              )}
            >
              {tab === id && (
                <motion.span
                  layoutId="alerts-tab"
                  className="rgb-fill absolute inset-0 rounded-lg"
                  transition={{ type: "spring", stiffness: 380, damping: 32 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-2">
                <Icon className="h-4 w-4" />
                {label}
                {count > 0 && (
                  <span
                    className={cn(
                      "rounded-full px-1.5 py-0.5 text-[10px] font-semibold",
                      tab === id
                        ? "bg-white/25 text-white"
                        : "bg-[var(--background)] text-[var(--text-secondary)]"
                    )}
                  >
                    {count}
                  </span>
                )}
              </span>
            </button>
          );
        })}
      </div>

      {/* Price Alerts */}
      {tab === "alerts" &&
        (priceAlerts.length === 0 ? (
          <EmptyState
            icon={<Bell className="h-8 w-8 text-[var(--text-muted)]" />}
            title="No price alerts yet"
            description="Create an alert and we'll let you know the moment a product hits your target price."
            action={
              <Button onClick={openCreateModal} disabled={products.length === 0}>
                <Plus className="h-4 w-4" />
                Create your first alert
              </Button>
            }
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence mode="popLayout">
              {priceAlerts.map((alert, index) => {
                const product = products.find((p) => p.id === alert.productId);
                const currentPrice = getCurrentPrice(alert.productId, product?.price ?? 0);
                const progress = progressTowardTrigger(
                  alert.condition,
                  currentPrice,
                  alert.targetPrice
                );
                const isTriggered = alert.isTriggered;

                return (
                  <motion.div
                    key={alert.id}
                    layout
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                  >
                    <Card padding="md" rgbBorder className="flex h-full flex-col">
                      <div className="mb-3 flex items-start justify-between gap-2">
                        <div className="flex items-center gap-3">
                          {product ? (
                            <ProductImage product={product} className="h-11 w-11 rounded-xl text-2xl" />
                          ) : (
                            <span className="text-3xl">📦</span>
                          )}
                          <div>
                            <h3 className="font-medium text-[var(--text-primary)]">
                              {product?.name ?? "Removed product"}
                            </h3>
                            <p className="text-xs text-[var(--text-muted)]">
                              {product?.category ?? "No category"}
                            </p>
                          </div>
                        </div>
                        <Badge
                          variant={isTriggered ? "success" : "default"}
                          className="shrink-0"
                        >
                          {isTriggered ? "Triggered" : CONDITION_LABEL[alert.condition]}
                        </Badge>
                      </div>

                      <div className="mb-1 flex items-end justify-between">
                        <div>
                          <p className="text-xs text-[var(--text-muted)]">Current price</p>
                          <p className="font-display text-lg font-bold text-[var(--text-primary)]">
                            {formatCurrency(currentPrice)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-[var(--text-muted)]">Target</p>
                          <p className="font-display text-lg font-bold text-[var(--accent)]">
                            {formatCurrency(alert.targetPrice)}
                          </p>
                        </div>
                      </div>

                      <ProgressBar
                        value={Math.round(progress)}
                        size="sm"
                        showLabel={false}
                        className="mb-3"
                      />

                      <div className="mt-auto">
                        <p className="mb-2 text-xs text-[var(--text-muted)]">
                          {isTriggered && alert.triggeredAt
                            ? `Triggered ${formatRelativeTime(alert.triggeredAt)}`
                            : `${Math.round(progress)}% of the way to your target`}
                        </p>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full text-[var(--error)] hover:text-[var(--error)]"
                          onClick={() => deletePriceAlert(alert.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete alert
                        </Button>
                      </div>
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        ))}

      {/* Notifications */}
      {tab === "notifications" &&
        (notifications.length === 0 ? (
          <EmptyState
            icon={<CheckCheck className="h-8 w-8 text-[var(--text-muted)]" />}
            title="You're all caught up"
            description="Price alerts, deals and recommendations will show up here."
            action={
              <Button variant="secondary" onClick={() => setPage("products")}>
                Browse products
              </Button>
            }
          />
        ) : (
          <div className="space-y-3">
            {unreadNotificationCount > 0 && (
              <div className="flex justify-end">
                <Button variant="ghost" size="sm" onClick={markAllNotificationsAsRead}>
                  <CheckCheck className="h-4 w-4" />
                  Mark all as read
                </Button>
              </div>
            )}

            <AnimatePresence initial={false}>
              {notifications.map((notification, index) => {
                const meta = NOTIFICATION_META[notification.type] ?? NOTIFICATION_META.system;
                const Icon = meta.icon;
                const product = notification.productId
                  ? products.find((p) => p.id === notification.productId)
                  : undefined;

                return (
                  <motion.div
                    key={notification.id}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.25, delay: Math.min(index, 8) * 0.03 }}
                  >
                    <Card
                      padding="md"
                      hover={false}
                      className={cn(
                        "border-l-4",
                        meta.tint,
                        !notification.read && "bg-[var(--surface-elevated)]"
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={cn(
                            "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
                            meta.iconClass
                          )}
                        >
                          <Icon className="h-4 w-4" />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3
                              className={cn(
                                "text-[var(--text-primary)]",
                                notification.read ? "font-medium" : "font-semibold"
                              )}
                            >
                              {notification.title}
                            </h3>
                            <Badge variant="default" className="text-[10px]">
                              {meta.label}
                            </Badge>
                            {!notification.read && (
                              <span
                                aria-label="Unread"
                                className="h-2 w-2 rounded-full bg-[var(--accent)]"
                              />
                            )}
                          </div>

                          <p className="mt-1 text-sm text-[var(--text-secondary)]">
                            {notification.message}
                          </p>

                          <p className="mt-1.5 text-xs text-[var(--text-muted)]">
                            {formatRelativeTime(notification.createdAt)}
                            {product ? ` · ${product.name}` : ""}
                          </p>
                        </div>

                        <div className="flex shrink-0 gap-1">
                          {!notification.read && (
                            <Button
                              variant="ghost"
                              size="sm"
                              aria-label={`Mark "${notification.title}" as read`}
                              onClick={() => markNotificationAsRead(notification.id)}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            aria-label={`Delete "${notification.title}"`}
                            className="text-[var(--error)] hover:text-[var(--error)]"
                            onClick={() => deleteNotification(notification.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        ))}

      {/* Create Alert Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="New Price Alert"
        description="We'll notify you when the price moves as you specified."
      >
        <div className="space-y-4">
          <div>
            <label
              htmlFor="alert-product"
              className="mb-1.5 block text-sm font-medium text-[var(--text-secondary)]"
            >
              Product
            </label>
            <select
              id="alert-product"
              value={productId}
              onChange={(e) => handleProductChange(e.target.value)}
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm text-[var(--text-primary)] focus-ring focus:border-[var(--accent)]"
            >
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.emoji} {product.name} — {formatCurrency(product.price)}
                </option>
              ))}
            </select>
          </div>

          <Input
            label="Target price"
            type="number"
            min={0}
            step="1"
            prefix="₹"
            value={targetPrice}
            onChange={(e) => setTargetPrice(e.target.value)}
            placeholder="250"
          />

          <div>
            <span className="mb-1.5 block text-sm font-medium text-[var(--text-secondary)]">
              Notify me when the price
            </span>
            <div className="flex flex-col gap-2 sm:flex-row">
              {CONDITIONS.map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => setCondition(value)}
                  aria-pressed={condition === value}
                  className={cn(
                    "flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    condition === value
                      ? "bg-[var(--accent-subtle)] text-[var(--accent)]"
                      : "bg-[var(--background)] text-[var(--text-muted)] hover:bg-[var(--border)]"
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {formError && (
            <p role="alert" className="text-sm text-[var(--error)]">
              {formError}
            </p>
          )}

          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateAlert}>Create Alert</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}