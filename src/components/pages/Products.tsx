import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Search, SlidersHorizontal, Pencil, Trash2, PackageOpen, TrendingUp, TrendingDown, Star, Heart } from "lucide-react";
import { useApp } from "../../context/AppContext";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Modal } from "../ui/Modal";
import { Badge } from "../ui/Badge";
import { EmptyState } from "../ui/EmptyState";
import { formatCurrency, formatRatio } from "../../utils/optimization";
import { ProductImage } from "../ui/ProductImage";
import { Product, SortOption } from "../../types";
import { cn } from "../../utils/cn";

const sortOptions: { value: SortOption; label: string }[] = [
  { value: "name", label: "Name" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "utility-desc", label: "Utility: High to Low" },
  { value: "ratio-desc", label: "Best Value" },
];

const emojis = ["🎧", "⌨️", "🖱️", "🔌", "📷", "💡", "💻", "💾", "🟦", "🔊", "🎮", "📱", "🖥️", "🎙️", "🕹️"];

export function Products() {
  const {
    filteredProducts,
    addProduct,
    updateProduct,
    deleteProduct,
    searchQuery,
    setSearchQuery,
    sortOption,
    setSortOption,
    getMarketAnalysis,
    addToWishlist,
    removeFromWishlistByProductId,
    isInWishlist,
  } = useApp();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    utility: "",
    emoji: "🎧",
    image: "",
    category: "",
  });

  const handleOpenAdd = () => {
    setEditingProduct(null);
    setFormData({ name: "", price: "", utility: "", emoji: emojis[0], image: "", category: "General" });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      price: product.price.toString(),
      utility: product.utility.toString(),
      emoji: product.emoji,
      image: product.image ?? "",
      category: product.category || "General",
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      name: formData.name,
      price: Number(formData.price),
      utility: Number(formData.utility),
      emoji: formData.emoji,
      image: formData.image.trim() ? formData.image.trim() : undefined,
      category: formData.category,
    };
    if (editingProduct) {
      updateProduct(editingProduct.id, data);
    } else {
      addProduct(data);
    }
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-[var(--text-primary)] sm:text-3xl">
            <span className="rgb-text-soft">Products</span>
          </h1>
          <p className="mt-1 text-[var(--text-secondary)]">
            Manage the products available to your optimizer.
          </p>
        </div>
        <Button onClick={handleOpenAdd} glow>
          <Plus className="h-4 w-4" />
          Add Product
        </Button>
      </div>

      {/* Filters */}
      <Card padding="sm" hover={false} rgbBorderActive rgbBorder className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            type="text"
            placeholder="Search products..."
            aria-label="Search products"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] py-2.5 pl-9 pr-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus-ring focus:border-[var(--accent)]"
          />
        </div>
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-[var(--text-muted)]" />
          <select
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value as SortOption)}
            className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm text-[var(--text-primary)] focus-ring focus:border-[var(--accent)]"
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </Card>

      {/* Products Grid */}
      {filteredProducts.length === 0 ? (
        <EmptyState
          icon={<PackageOpen className="h-8 w-8 text-[var(--text-muted)]" />}
          title="No products yet"
          description="Add your first product and let SmartCart find the best combination."
          action={<Button onClick={handleOpenAdd}>Add Product</Button>}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <AnimatePresence mode="popLayout">
            {filteredProducts.map((product, index) => {
              const marketAnalysis = getMarketAnalysis(product.id);
              return (
                <motion.div
                  key={product.id}
                  layout
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ duration: 0.2, delay: index * 0.03 }}
                >
                  <Card padding="md" rgbBorder className="group relative overflow-hidden">
                    {/* Hero photo */}
                    <div className="-m-5 mb-0 sm:-m-6">
                      <ProductImage
                        product={product}
                        className="h-40 w-full rounded-none"
                        imgClassName="transition-transform duration-300 group-hover:scale-105"
                        eager={index < 4}
                      />
                    </div>
                    <div className="mt-4 flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="truncate font-medium text-[var(--text-primary)]">{product.name}</h3>
                        <p className="text-xs text-[var(--text-muted)]">{product.category}</p>
                      </div>
                      <div className="flex shrink-0 gap-1 opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100">
                        <button
                          onClick={() => {
                            if (isInWishlist(product.id)) {
                              removeFromWishlistByProductId(product.id);
                            } else {
                              addToWishlist(product.id);
                            }
                          }}
                          aria-label={isInWishlist(product.id) ? "Remove from wishlist" : "Add to wishlist"}
                          className={cn(
                            "rounded-lg p-1.5 transition-colors",
                            isInWishlist(product.id)
                              ? "text-[var(--error)] hover:bg-[var(--error-subtle)]"
                              : "text-[var(--text-muted)] hover:bg-[var(--background)] hover:text-[var(--accent)]"
                          )}
                        >
                          <Heart className={cn("h-4 w-4", isInWishlist(product.id) && "fill-current")} />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(product)}
                          aria-label={`Edit ${product.name}`}
                          className="rounded-lg p-1.5 text-[var(--text-muted)] hover:bg-[var(--background)] hover:text-[var(--accent)]"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => deleteProduct(product.id)}
                          aria-label={`Delete ${product.name}`}
                          className="rounded-lg p-1.5 text-[var(--text-muted)] hover:bg-[var(--error-subtle)] hover:text-[var(--error)]"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {/* Market Data Insights */}
                    {marketAnalysis && (
                      <div className="mt-3 flex flex-wrap gap-2">
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
                        {marketAnalysis.sentiment.averageRating >= 4 && (
                          <Badge variant="accent" className="text-xs flex items-center gap-1">
                            <Star className="h-3 w-3" />
                            {marketAnalysis.sentiment.averageRating}
                          </Badge>
                        )}
                      </div>
                    )}

                    <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                      <div className="rounded-lg bg-[var(--background)] p-2">
                        <p className="text-xs text-[var(--text-muted)]">Price</p>
                        <p className="font-display text-sm font-bold text-[var(--text-primary)]">
                          {formatCurrency(product.price)}
                        </p>
                      </div>
                      <div className="rounded-lg bg-[var(--background)] p-2">
                        <p className="text-xs text-[var(--text-muted)]">Utility</p>
                        <p className="font-display text-sm font-bold text-[var(--success)]">
                          {product.utility}
                        </p>
                      </div>
                      <div className="rounded-lg bg-[var(--background)] p-2">
                        <p className="text-xs text-[var(--text-muted)]">Ratio</p>
                        <p className="font-display rgb-text-soft text-sm font-bold">
                          {formatRatio(product.utility, product.price)}
                        </p>
                      </div>
                    </div>

                    {/* Market Recommendation */}
                    {marketAnalysis && (
                      <div className="mt-3 rounded-lg bg-[var(--background)] p-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-[var(--text-muted)]">Recommendation</span>
                          <Badge
                            variant={
                              marketAnalysis.recommendation === "buy"
                                ? "success"
                                : marketAnalysis.recommendation === "sell"
                                ? "error"
                                : "default"
                            }
                            className="text-xs"
                          >
                            {marketAnalysis.recommendation.toUpperCase()}
                          </Badge>
                        </div>
                        <div className="mt-1 flex items-center gap-1">
                          <span className="text-xs text-[var(--text-muted)]">Confidence:</span>
                          <span className="text-xs font-semibold text-[var(--text-primary)]">
                            {marketAnalysis.confidence}%
                          </span>
                        </div>
                      </div>
                    )}

                    <Badge variant="rgb" className="absolute right-4 top-4 hidden lg:inline-flex">
                      {formatRatio(product.utility, product.price)} / ₹
                    </Badge>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingProduct ? "Edit product" : "Add product"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Product name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g. Wireless Earbuds"
            required
          />
          <Input
            label="Image URL (optional — real photo)"
            value={formData.image}
            onChange={(e) => setFormData({ ...formData, image: e.target.value })}
            placeholder="https://…"
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Price"
              type="number"
              prefix="₹"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              placeholder="0"
              required
            />
            <Input
              label="Utility"
              type="number"
              value={formData.utility}
              onChange={(e) => setFormData({ ...formData, utility: e.target.value })}
              placeholder="0"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[var(--text-secondary)]">
                Category
              </label>
              <input
                type="text"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm text-[var(--text-primary)] focus-ring focus:border-[var(--accent)]"
                placeholder="e.g. Audio"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[var(--text-secondary)]">
                Icon
              </label>
              <div className="flex flex-wrap gap-1">
                {emojis.slice(0, 8).map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setFormData({ ...formData, emoji })}
                    className={`h-9 w-9 rounded-lg text-lg transition-colors ${
                      formData.emoji === emoji
                        ? "bg-[var(--accent-subtle)] ring-2 ring-[var(--accent)]"
                        : "bg-[var(--background)] hover:bg-[var(--border)]"
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">
              {editingProduct ? "Save Changes" : "Add Product"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
