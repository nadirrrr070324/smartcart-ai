import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Package,
  Sparkles,
  Grid3X3,
  BarChart3,
  Bookmark,
  TrendingUp,
  Heart,
  Bell,
  Info,
  Settings,
  Moon,
  Sun,
  Menu,
  X,
  User,
  Palette,
} from "lucide-react";
import { useApp } from "../../context/AppContext";
import { Page } from "../../types";
import { cn } from "../../utils/cn";
import { Logo } from "../brand/Logo";

const navItems: { page: Page; label: string; icon: React.ElementType }[] = [
  { page: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { page: "products", label: "Products", icon: Package },
  { page: "optimizer", label: "Optimizer", icon: Sparkles },
  { page: "visualizer", label: "Algorithm Visualizer", icon: Grid3X3 },
  { page: "analytics", label: "Analytics", icon: BarChart3 },
  { page: "scenarios", label: "Saved Scenarios", icon: Bookmark },
  { page: "market", label: "Market Strategy", icon: TrendingUp },
  { page: "wishlist", label: "Wishlist", icon: Heart },
  { page: "alerts", label: "Alerts", icon: Bell },
  { page: "about", label: "About", icon: Info },
  { page: "settings", label: "Settings", icon: Settings },
];

const rgbLabels = {
  vivid: "RGB: Vivid",
  subtle: "RGB: Subtle",
  off: "RGB: Off",
} as const;

export function Sidebar() {
  const {
    page,
    setPage,
    isDarkMode,
    toggleDarkMode,
    rgbIntensity,
    cycleRgbIntensity,
  } = useApp();
  const [mobileOpen, setMobileOpen] = useState(false);

  const NavLink = ({ item }: { item: (typeof navItems)[0] }) => {
    const Icon = item.icon;
    const isActive = page === item.page;
    return (
      <button
        onClick={() => {
          setPage(item.page);
          setMobileOpen(false);
        }}
        aria-current={isActive ? "page" : undefined}
        className={cn(
          "group relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 focus-ring",
          isActive
            ? "text-[var(--text-primary)]"
            : "text-[var(--text-secondary)] hover:bg-[var(--surface-elevated)] hover:text-[var(--text-primary)]"
        )}
      >
        {/* Active backdrop + sliding spectrum rail */}
        {isActive && (
          <>
            <motion.span
              layoutId="nav-active-bg"
              className="absolute inset-0 rounded-xl bg-[var(--accent-subtle)]"
              transition={{ type: "spring", damping: 28, stiffness: 320 }}
            />
            <span className="rgb-fill absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-full" />
          </>
        )}

        <Icon
          className={cn(
            "relative h-[18px] w-[18px] transition-transform duration-200 group-hover:scale-110",
            // rgb-hue (not rgb-text): a gradient-clipped text fill cannot tint an
            // SVG stroke, so animated hue rotation is what actually colours these.
            isActive ? "rgb-hue text-[var(--accent)]" : "text-[var(--text-muted)] group-hover:text-[var(--text-primary)]"
          )}
        />
        <span className="relative">{item.label}</span>
      </button>
    );
  };

  const RgbToggle = (
    <button
      onClick={cycleRgbIntensity}
      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-elevated)] hover:text-[var(--text-primary)] focus-ring"
    >
      <Palette className="h-[18px] w-[18px] text-[var(--text-muted)]" />
      {rgbLabels[rgbIntensity]}
      <span
        className={cn(
          "ml-auto h-2 w-2 rounded-full",
          rgbIntensity === "off" ? "bg-[var(--text-muted)]" : "rgb-fill rgb-beacon"
        )}
      />
    </button>
  );

  return (
    <>
      {/* Mobile top bar */}
      <div className="glass fixed left-0 right-0 top-0 z-40 flex h-16 items-center justify-between border-b border-[var(--border)] px-4 lg:hidden">
        <Logo size={34} compact />
        <button
          onClick={() => setMobileOpen(true)}
          aria-label="Open navigation"
          className="rounded-xl p-2 text-[var(--text-secondary)] hover:bg-[var(--background)]"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      {/* Desktop sidebar */}
      <aside className="glass fixed left-0 top-0 hidden h-screen w-64 flex-col border-r border-[var(--border)] lg:flex">
        <div className="flex h-16 items-center border-b border-[var(--border)] px-5">
          <Logo size={38} />
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-4">
          {navItems.map((item) => (
            <NavLink key={item.page} item={item} />
          ))}
        </nav>

        <div className="space-y-1 border-t border-[var(--border)] p-4">
          {RgbToggle}
          <button
            onClick={toggleDarkMode}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-elevated)] hover:text-[var(--text-primary)] focus-ring"
          >
            {isDarkMode ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
            {isDarkMode ? "Light mode" : "Dark mode"}
          </button>
          <div className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--accent-subtle)] text-[var(--accent)]">
              <User className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-[var(--text-primary)]">Alex Designer</p>
              <p className="truncate text-xs text-[var(--text-muted)]">Pro Plan</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm lg:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed left-0 top-0 z-50 flex h-screen w-72 flex-col border-r border-[var(--border)] bg-[var(--surface)] shadow-2xl lg:hidden"
            >
              <div className="flex h-16 shrink-0 items-center justify-between border-b border-[var(--border)] px-4">
                <Logo size={34} />
                <button
                  onClick={() => setMobileOpen(false)}
                  aria-label="Close navigation"
                  className="rounded-xl p-2 text-[var(--text-secondary)] hover:bg-[var(--background)]"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <nav className="flex-1 space-y-1 overflow-y-auto p-4">
                {navItems.map((item) => (
                  <NavLink key={item.page} item={item} />
                ))}
              </nav>
              <div className="shrink-0 space-y-1 border-t border-[var(--border)] p-4">
                {RgbToggle}
                <button
                  onClick={toggleDarkMode}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-elevated)]"
                >
                  {isDarkMode ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
                  {isDarkMode ? "Light mode" : "Dark mode"}
                </button>
                <div className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--accent-subtle)] text-[var(--accent)]">
                    <User className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-[var(--text-primary)]">Alex Designer</p>
                    <p className="truncate text-xs text-[var(--text-muted)]">Pro Plan</p>
                  </div>
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}