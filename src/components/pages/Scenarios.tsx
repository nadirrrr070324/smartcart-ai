import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bookmark,
  Plus,
  Clock,
  MoreHorizontal,
  Copy,
  Pencil,
  Trash2,
  FolderOpen,
} from "lucide-react";
import { useApp } from "../../context/AppContext";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Modal } from "../ui/Modal";
import { EmptyState } from "../ui/EmptyState";
import { formatCurrency } from "../../utils/optimization";

export function Scenarios() {
  const { scenarios, saveScenario, deleteScenario, duplicateScenario, renameScenario, setBudget, setPage } = useApp();
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newScenarioName, setNewScenarioName] = useState("");
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  const handleCreate = () => {
    if (newScenarioName.trim()) {
      saveScenario(newScenarioName);
      setNewScenarioName("");
      setCreateModalOpen(false);
    }
  };

  const formatRelativeTime = (date: Date) => {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 60) return "Just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-[var(--text-primary)] sm:text-3xl">
            Saved <span className="rgb-text-soft">Scenarios</span>
          </h1>
          <p className="mt-1 text-[var(--text-secondary)]">
            Revisit and manage your optimized cart configurations.
          </p>
        </div>
        <Button onClick={() => setCreateModalOpen(true)}>
          <Plus className="h-4 w-4" />
          Save Scenario
        </Button>
      </div>

      {scenarios.length === 0 ? (
        <EmptyState
          icon={<FolderOpen className="h-8 w-8 text-[var(--text-muted)]" />}
          title="No saved scenarios"
          description="Save your optimized carts here to compare and reuse them later."
          action={<Button onClick={() => setCreateModalOpen(true)}>Save Scenario</Button>}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {scenarios.map((scenario, index) => (
              <motion.div
                key={scenario.id}
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <Card padding="md" rgbBorder className="group relative">
                  <div className="mb-4 flex items-start justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent-subtle)] text-[var(--accent)]">
                      <Bookmark className="h-5 w-5" />
                    </div>
                    <div className="relative">
                      <button
                        onClick={() => setActiveMenu(activeMenu === scenario.id ? null : scenario.id)}
                        className="rounded-lg p-1.5 text-[var(--text-muted)] hover:bg-[var(--background)] hover:text-[var(--text-primary)]"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </button>
                      {activeMenu === scenario.id && (
                        <div className="absolute right-0 top-full z-10 mt-1 w-40 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-1 shadow-lg">
                          <button
                            onClick={() => {
                              const newName = prompt("Rename scenario:", scenario.name);
                              if (newName && newName.trim()) {
                                renameScenario(scenario.id, newName.trim());
                              }
                              setActiveMenu(null);
                            }}
                            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-[var(--text-secondary)] hover:bg-[var(--background)] hover:text-[var(--text-primary)]"
                          >
                            <Pencil className="h-4 w-4" /> Rename
                          </button>
                          <button
                            onClick={() => {
                              duplicateScenario(scenario.id);
                              setActiveMenu(null);
                            }}
                            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-[var(--text-secondary)] hover:bg-[var(--background)] hover:text-[var(--text-primary)]"
                          >
                            <Copy className="h-4 w-4" /> Duplicate
                          </button>
                          <button
                            onClick={() => {
                              deleteScenario(scenario.id);
                              setActiveMenu(null);
                            }}
                            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-[var(--error)] hover:bg-[var(--error-subtle)]"
                          >
                            <Trash2 className="h-4 w-4" /> Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <h3 className="font-display text-lg font-bold text-[var(--text-primary)]">{scenario.name}</h3>

                  <div className="mt-4 grid grid-cols-3 gap-2">
                    <div className="rounded-lg bg-[var(--background)] p-2 text-center">
                      <p className="text-xs text-[var(--text-muted)]">Budget</p>
                      <p className="font-display text-sm font-bold text-[var(--text-primary)]">
                        {formatCurrency(scenario.budget)}
                      </p>
                    </div>
                    <div className="rounded-lg bg-[var(--background)] p-2 text-center">
                      <p className="text-xs text-[var(--text-muted)]">Utility</p>
                      <p className="font-display text-sm font-bold text-[var(--success)]">
                        {scenario.utility}
                      </p>
                    </div>
                    <div className="rounded-lg bg-[var(--background)] p-2 text-center">
                      <p className="text-xs text-[var(--text-muted)]">Products</p>
                      <p className="font-display text-sm font-bold text-[var(--text-primary)]">
                        {scenario.products.length}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
                      <Clock className="h-3 w-3" />
                      {formatRelativeTime(scenario.updatedAt)}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setBudget(scenario.budget);
                        setPage("optimizer");
                      }}
                    >
                      Open
                    </Button>
                  </div>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Create Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Save scenario"
        description="Save your current cart configuration."
      >
        <div className="space-y-4">
          <Input
            label="Scenario name"
            value={newScenarioName}
            onChange={(e) => setNewScenarioName(e.target.value)}
            placeholder="e.g. Weekend Electronics"
          />
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={!newScenarioName.trim()}>
              Save Scenario
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
