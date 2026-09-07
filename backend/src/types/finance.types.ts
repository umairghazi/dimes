export type FinanceTransactionType = "expense" | "income";

export interface FinanceTransaction {
  id: string;
  userId: string;
  date: string;
  description: string;
  amount: number;
  currency: string;
  categoryId: string | null;
  category: string;
  mainCategory: string;
  type: FinanceTransactionType;
  merchantName: string | null;
  source: string;
  isRecurring: boolean;
  tags: string[];
  originalDescription: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface FinanceCategory {
  id: string;
  userId: string;
  name: string;
  mainCategory: string | null;
  type: FinanceTransactionType;
  isFixed: boolean;
  sortOrder: number;
}

export interface MonthlyPlan {
  id: string;
  userId: string;
  monthYear: string;
  categoryId: string | null;
  categoryName: string;
  type: FinanceTransactionType;
  plannedAmount: number;
  currency: string;
  carryForward: boolean;
}

export interface MonthlyBalance {
  id: string;
  userId: string;
  monthYear: string;
  startingBalance: number;
  endingBalance: number | null;
  currency: string;
}

export interface MonthlySummary {
  transactions: FinanceTransaction[];
  plans: MonthlyPlan[];
  balance: MonthlyBalance | null;
}

export function money(value: string | number | null): number {
  if (value === null) return 0;
  const numberValue = typeof value === "number" ? value : Number(value);
  return Number.isFinite(numberValue) ? numberValue : 0;
}

export function monthBounds(monthYear: string): { from: string; to: string } {
  const [year, month] = monthYear.split("-").map(Number);
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return {
    from: `${year}-${String(month).padStart(2, "0")}-01`,
    to: `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`,
  };
}
