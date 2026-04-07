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

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
