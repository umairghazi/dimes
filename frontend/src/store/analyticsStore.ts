import { create } from "zustand";

function currentMonthYear(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

interface AnalyticsStore {
  month: string;
  prevMonth: () => void;
  nextMonth: () => void;
}

export const useAnalyticsStore = create<AnalyticsStore>((set) => ({
  month: currentMonthYear(),

  prevMonth: () =>
    set((s) => {
      const [y, mo] = s.month.split("-").map(Number);
      const d = new Date(y, mo - 2, 1);
      return { month: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}` };
    }),

  nextMonth: () =>
    set((s) => {
      const [y, mo] = s.month.split("-").map(Number);
      const d = new Date(y, mo, 1);
      return { month: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}` };
    }),
}));

export function isCurrentMonthYear(month: string): boolean {
  return month === currentMonthYear();
}
