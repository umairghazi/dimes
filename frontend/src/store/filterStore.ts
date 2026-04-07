import { create } from "zustand";

interface ExpenseFilters {
  category?: string;
  dateFrom?: string;
  dateTo?: string;
  source?: string;
  isRecurring?: boolean;
  search?: string;
}

interface FilterState {
  filters: ExpenseFilters;
  setFilter: <K extends keyof ExpenseFilters>(key: K, value: ExpenseFilters[K]) => void;
  clearFilters: () => void;
}

export const useFilterStore = create<FilterState>((set) => ({
  filters: {},
  setFilter: (key, value) =>
    set((s) => ({ filters: { ...s.filters, [key]: value } })),
  clearFilters: () => set({ filters: {} }),
}));
