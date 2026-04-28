import { create } from "zustand";

interface ExpenseFilters {
  categoryId?: string;
  dateFrom?: string;
  dateTo?: string;
  source?: string;
  isRecurring?: boolean;
  search?: string;
  type?: "expense" | "income";
}

interface FilterState {
  filters: ExpenseFilters;
  setFilter: <K extends keyof ExpenseFilters>(key: K, value: ExpenseFilters[K]) => void;
  clearFilters: () => void;
}

export const useFilterStore = create<FilterState>((set) => ({
  filters: { type: "expense" },
  setFilter: (key, value) =>
    set((s) => ({ filters: { ...s.filters, [key]: value } })),
  clearFilters: () => set({ filters: { type: "expense" } }),
}));
