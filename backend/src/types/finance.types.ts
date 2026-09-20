export type FinanceCategoryType = "expense" | "income";
export type FinanceTransactionType = FinanceCategoryType | "expense_refund";

export function expenseAmount(transaction: { type: FinanceTransactionType; amount: number }): number {
  return transaction.type === "expense_refund" ? -transaction.amount : transaction.type === "expense" ? transaction.amount : 0;
}

export interface FinanceTransaction {
  id: string;
  userId: string;
  date: string;
  monthYear: string;
  description: string;
  amount: number;
  currency: string;
  categoryId: string | null;
  category: string;
  categoryPath: Array<{ id: string; name: string }>;
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
  parentId: string | null;
  parentName: string | null;
  name: string;
  type: FinanceCategoryType;
  isFixed: boolean;
  sortOrder: number;
  depth: number;
  path: Array<{ id: string; name: string }>;
  hasChildren: boolean;
}

export interface MonthlyPlan {
  id: string;
  userId: string;
  monthYear: string;
  categoryId: string | null;
  categoryName: string;
  type: FinanceCategoryType;
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

export interface YearlySummaryMonth {
  monthYear: string;
  monthLabel: string;
  income: number;
  expenses: number;
  net: number;
  startingBalance: number | null;
  endingBalance: number | null;
}

export interface YearlyCategorySummary {
  categoryId: string | null;
  categoryName: string;
  categoryPath: Array<{ id: string; name: string }>;
  amount: number;
  count: number;
  depth: number;
}

export interface YearlySummary {
  year: number;
  months: YearlySummaryMonth[];
  categorySpend: YearlyCategorySummary[];
  totals: {
    income: number;
    expenses: number;
    net: number;
  };
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

export function monthFromDate(date: string): string {
  return date.slice(0, 7);
}
