import { LayoutDashboard, Package, Sparkles, Bookmark, TrendingUp, Heart, Bell } from "lucide-react";
import { motion } from "framer-motion";
import { useApp } from "../../context/AppContext";
import { Page } from "../../types";
import { cn } from "../../utils/cn";

const mobileItems: { page: Page; label: string; icon: React.ElementType }[] = [
  { page: "dashboard", label: "Home", icon: LayoutDashboard },
  { page: "products", label: "Products", icon: Package },
  { page: "optimizer", label: "Optimize", icon: Sparkles },
  { page: "market", label: "Market", icon: TrendingUp },
  { page: "wishlist", label: "Wishlist", icon: Heart },
  { page: "alerts", label: "Alerts", icon: Bell },
  { page: "scenarios", label: "Saved", icon: Bookmark },
];

export function MobileNav() {
  const { page, setPage } = useApp();

  return (
    <nav className="glass pb-safe fixed bottom-0 left-0 right-0 z-40 border-t border-[var(--border)] lg:hidden">
      <div className="flex items-center justify-around px-2 py-2">
        {mobileItems.map((item) => {
          const Icon = item.icon;
          const isActive = page === item.page;
          return (
            <button
              key={item.page}
              onClick={() => setPage(item.page)}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "relative flex flex-1 flex-col items-center gap-1 rounded-xl px-2 py-1.5 text-[11px] font-medium transition-colors focus-ring",
                isActive
                  ? "text-[var(--text-primary)]"
                  : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              )}
            >
              {isActive && (
                <>
                  <motion.span
                    layoutId="mobile-nav-active"
                    className="absolute inset-x-1 inset-y-0 rounded-xl bg-[var(--accent-subtle)]"
                    transition={{ type: "spring", damping: 28, stiffness: 340 }}
                  />
                  <span className="rgb-fill absolute -top-2 left-1/2 h-[3px] w-8 -translate-x-1/2 rounded-full" />
                </>
              )}
              <Icon
                className={cn(
                  "relative h-5 w-5 transition-transform duration-200",
                  isActive && "rgb-hue scale-110 text-[var(--accent)]"
                )}
              />
              <span className="relative">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}