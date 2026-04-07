export type ExpenseCategory =
  | "Food & Dining"
  | "Transport"
  | "Shopping"
  | "Entertainment"
  | "Health"
  | "Utilities"
  | "Travel"
  | "Income"
  | "Subscriptions"
  | "Personal Care"
  | "Education"
  | "Other";

export const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  "Food & Dining",
  "Transport",
  "Shopping",
  "Entertainment",
  "Health",
  "Utilities",
  "Travel",
  "Income",
  "Subscriptions",
  "Personal Care",
  "Education",
  "Other",
];

export interface Expense {
  id: string;
  userId: string;
  date: string;
  description: string;
  amount: number;
  currency: string;
  category: ExpenseCategory;
  subCategory?: string;
  merchantName?: string;
  source: "manual" | "csv-upload";
  isRecurring: boolean;
  tags: string[];
  originalDescription?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ExpenseFilters {
  category?: string;
  dateFrom?: string;
  dateTo?: string;
  source?: string;
  isRecurring?: boolean;
}

export interface PaginatedExpenses {
  data: Expense[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
