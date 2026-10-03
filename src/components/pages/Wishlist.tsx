import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, Plus, Trash2, Star, TrendingUp, TrendingDown } from "lucide-react";
import { useApp } from "../../context/AppContext";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";
import { Modal } from "../ui/Modal";
import { Badge } from "../ui/Badge";
import { EmptyState } from "../ui/EmptyState";
import { formatCurrency } from "../../utils/optimization";
import { ProductImage } from "../ui/ProductImage";
import { cn } from "../../utils/cn";

export function Wishlist() {
  const {
    wishlist,
    removeFromWishlist,
    addToWishlist,
    products,
    selectedIds,
    toggleSelection,
    setPage,
    getMarketAnalysis,
  } = useApp();

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");

  const wishlistProducts = wishlist
    .map((item) => products.find((p) => p.id === item.productId))
    .filter((p): p is Exclude<typeof p, undefined> => p !== undefined);

  const handleEdit = (itemId: string) => {
    const item = wishlist.find((w) => w.id === itemId);
    if (item) {
      setEditingItem(itemId);
      setNotes(item.notes || "");
      setPriority(item.priority);
      setEditModalOpen(true);
    }
  };

  const handleSave = () => {
    if (editingItem) {
      const item = wishlist.find((w) => w.id === editingItem);
      if (item) {
        removeFromWishlist(editingItem);
        addToWishlist(item.productId, notes, priority);
      }
    }
    setEditModalOpen(false);
    setEditingItem(null);
    setNotes("");
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "text-[var(--error)] bg-[var(--error-subtle)]";
      case "medium":
        return "text-[var(--warning)] bg-[var(--warning-subtle)]";
      case "low":
        return "text-[var(--success)] bg-[var(--success-subtle)]";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-[var(--text-primary)] sm:text-3xl">
            <span className="rgb-text-soft">Wishlist</span>
          </h1>
          <p className="mt-1 text-[var(--text-secondary)]">
            Save products for later and track price changes.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setPage("products")}>
            <Plus className="h-4 w-4" />
            Add Products
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card padding="md" rgbBorder>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent-subtle)] text-[var(--accent)]">
              <Heart className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-[var(--text-muted)]">Total Items</p>
              <p className="font-display text-2xl font-bold text-[var(--text-primary)]">{wishlist.length}</p>
            </div>
          </div>
        </Card>
        <Card padding="md" rgbBorder>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--success-subtle)] text-[var(--success)]">
              <Star className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-[var(--text-muted)]">High Priority</p>
              <p className="font-display text-2xl font-bold text-[var(--text-primary)]">
                {wishlist.filter((w) => w.priority === "high").length}
              </p>
            </div>
          </div>
        </Card>
        <Card padding="md" rgbBorder>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--warning-subtle)] text-[var(--warning)]">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-[var(--text-muted)]">Total Value</p>
              <p className="font-display text-2xl font-bold text-[var(--text-primary)]">
                {formatCurrency(wishlistProducts.reduce((sum, p) => sum + p.price, 0))}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Wishlist Items */}
      {wishlist.length === 0 ? (
        <EmptyState
          icon={<Heart className="h-8 w-8 text-[var(--text-muted)]" />}
          title="Your wishlist is empty"
          description="Save products you're interested in and track their prices."
          action={<Button onClick={() => setPage("products")}>Browse Products</Button>}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {wishlist.map((item, index) => {
              const product = products.find((p) => p.id === item.productId);
              if (!product) return null;
              const marketAnalysis = getMarketAnalysis(product.id);
              const isSelected = selectedIds.includes(product.id);

              return (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <Card padding="md" rgbBorder className="group relative overflow-hidden">
                    {product.image ? (
                      <div className="-m-5 mb-4 sm:-m-6">
                        <ProductImage
                          product={product}
                          className="h-36 w-full rounded-none"
                          imgClassName="transition-transform duration-300 group-hover:scale-105"
                        />
                      </div>
                    ) : null}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        {!product.image && <span className="text-3xl">{product.emoji}</span>}
                        <div>
                          <h3 className="font-medium text-[var(--text-primary)]">{product.name}</h3>
                          <p className="text-xs text-[var(--text-muted)]">{product.category}</p>
                        </div>
                      </div>
                      <Badge className={cn("text-xs", getPriorityColor(item.priority))}>
                        {item.priority}
                      </Badge>
                    </div>

                    {/* Market Insights */}
                    {marketAnalysis && (
                      <div className="mb-3 flex flex-wrap gap-1.5">
                        {marketAnalysis.price.discount > 0 && (
                          <Badge variant="success" className="text-xs">
                            -{marketAnalysis.price.discount}% OFF
                          </Badge>
                        )}
                        {marketAnalysis.trend.trend === "rising" && (
                          <Badge variant="warning" className="text-xs flex items-center gap-1">
                            <TrendingUp className="h-3 w-3" />
                            Rising
                          </Badge>
                        )}
                        {marketAnalysis.trend.trend === "falling" && (
                          <Badge variant="success" className="text-xs flex items-center gap-1">
                            <TrendingDown className="h-3 w-3" />
                            Dropping
                          </Badge>
                        )}
                      </div>
                    )}

                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="text-xs text-[var(--text-muted)]">Price</p>
                        <p className="font-display text-lg font-bold text-[var(--text-primary)]">
                          {formatCurrency(product.price)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-[var(--text-muted)]">Utility</p>
                        <p className="font-display text-lg font-bold text-[var(--success)]">
                          {product.utility}
                        </p>
                      </div>
                    </div>

                    {item.notes && (
                      <div className="mb-3 rounded-lg bg-[var(--background)] p-2">
                        <p className="text-xs text-[var(--text-muted)]">{item.notes}</p>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => handleEdit(item.id)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleSelection(product.id)}
                        className={cn(isSelected && "rgb-fill")}
                      >
                        {isSelected ? "Selected" : "Select"}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFromWishlist(item.id)}
                        className="text-[var(--error)] hover:text-[var(--error)]"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Edit Modal */}
      <Modal isOpen={editModalOpen} onClose={() => setEditModalOpen(false)} title="Edit Wishlist Item">
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[var(--text-secondary)]">
              Priority
            </label>
            <div className="flex gap-2">
              {(["low", "medium", "high"] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setPriority(p)}
                  className={cn(
                    "flex-1 rounded-lg px-3 py-2 text-sm font-medium capitalize transition-colors",
                    priority === p
                      ? "bg-[var(--accent-subtle)] text-[var(--accent)]"
                      : "bg-[var(--background)] text-[var(--text-muted)] hover:bg-[var(--border)]"
                  )}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[var(--text-secondary)]">
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add notes about this product..."
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus-ring focus:border-[var(--accent)]"
              rows={3}
            />
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setEditModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>Save Changes</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
