export type ExpenseCategory = string;
export type TransactionType = "expense" | "income" | "expense_refund";

export function expenseAmount(row: { type: TransactionType; amount: number }): number {
  return row.type === "expense_refund" ? -row.amount : row.type === "expense" ? row.amount : 0;
}

export interface Expense {
  id: string;
  userId: string;
  date: string;
  monthYear: string;
  description: string;
  amount: number;
  currency: string;
  category: ExpenseCategory;   // resolved name (always present in API response)
  categoryId?: string | null;
  categoryPath?: Array<{ id: string; name: string }>;
  type: TransactionType;
  subCategory?: string;
  merchantName?: string;
  source: string;
  isRecurring: boolean;
  tags: string[];
  originalDescription?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ExpenseFilters {
  categoryId?: string;
  dateFrom?: string;
  dateTo?: string;
  source?: string;
  isRecurring?: boolean;
  search?: string;
  type?: TransactionType;
}

export interface PaginatedExpenses {
  data: Expense[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
