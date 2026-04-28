export type ExpenseCategory = string;

export interface Expense {
  id: string;
  userId: string;
  date: string;
  description: string;
  amount: number;
  currency: string;
  category: ExpenseCategory;   // resolved name (always present in API response)
  categoryId?: string | null;
  type: "expense" | "income";
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
  categoryId?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  type?: "expense" | "income";
}

export interface PaginatedExpenses {
  data: Expense[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
