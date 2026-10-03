import { AnimatePresence, motion } from "framer-motion";
import { AppProvider, useApp } from "./context/AppContext";
import { Sidebar } from "./components/layout/Sidebar";
import { MobileNav } from "./components/layout/MobileNav";
import { AuroraBackground } from "./components/brand/AuroraBackground";
import { Dashboard } from "./components/pages/Dashboard";
import { Products } from "./components/pages/Products";
import { Optimizer } from "./components/pages/Optimizer";
import { Visualizer } from "./components/pages/Visualizer";
import { Analytics } from "./components/pages/Analytics";
import { Scenarios } from "./components/pages/Scenarios";
import { MarketStrategy } from "./components/pages/MarketStrategy";
import { Wishlist } from "./components/pages/Wishlist";
import { Alerts } from "./components/pages/Alerts";
import { About } from "./components/pages/About";
import { Settings } from "./components/pages/Settings";

const pageVariants = {
  initial: { opacity: 0, y: 10, filter: "blur(4px)" },
  animate: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.32, ease: [0.16, 1, 0.3, 1] as const },
  },
  exit: {
    opacity: 0,
    y: -8,
    filter: "blur(4px)",
    transition: { duration: 0.18, ease: [0.4, 0, 1, 1] as const },
  },
};

function PageContent() {
  const { page } = useApp();

  const pages: Record<typeof page, React.ReactNode> = {
    dashboard: <Dashboard />,
    products: <Products />,
    optimizer: <Optimizer />,
    visualizer: <Visualizer />,
    analytics: <Analytics />,
    scenarios: <Scenarios />,
    market: <MarketStrategy />,
    wishlist: <Wishlist />,
    alerts: <Alerts />,
    about: <About />,
    settings: <Settings />,
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={page}
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        className="h-full"
      >
        {pages[page]}
      </motion.div>
    </AnimatePresence>
  );
}

/** Screen-reader label so the skip target matches the app's single h1 region. */
function SkipLink() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-xl focus:bg-[var(--surface)] focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:shadow-lg focus:outline-none"
    >
      Skip to content
    </a>
  );
}

function AppShell() {
  return (
    <div className="relative min-h-screen bg-[var(--background)] text-[var(--text-primary)]">
      <AuroraBackground />
      <SkipLink />

      <div className="relative z-10">
        <Sidebar />
        <main id="main-content" className="min-h-screen pt-16 pb-20 lg:pb-0 lg:pl-64">
          <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
            <PageContent />
          </div>
        </main>
        <MobileNav />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppShell />
    </AppProvider>
  );
}