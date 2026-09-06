import { create } from "zustand";

function currentMonthYear(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

interface MonthStore {
  month: string;
  prevMonth: () => void;
  nextMonth: () => void;
}

export const useMonthStore = create<MonthStore>((set) => ({
  month: currentMonthYear(),

  prevMonth: () =>
    set((s) => {
      const [year, month] = s.month.split("-").map(Number);
      const date = new Date(year, month - 2, 1);
      return { month: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}` };
    }),

  nextMonth: () =>
    set((s) => {
      const [year, month] = s.month.split("-").map(Number);
      const date = new Date(year, month, 1);
      return { month: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}` };
    }),
}));

export function isCurrentMonthYear(month: string): boolean {
  return month === currentMonthYear();
}
