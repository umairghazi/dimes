import { apiClient } from "./client";
import { Expense } from "@/types/expense.types";
import { UserCategory } from "@/types/category.types";

export interface MonthlyPlan {
  id: string;
  userId: string;
  monthYear: string;
  categoryId: string | null;
  categoryName: string;
  type: "expense" | "income";
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

export interface FinanceSummary {
  transactions: Expense[];
  plans: MonthlyPlan[];
  balance: MonthlyBalance | null;
}

export const financeApi = {
  transactions: (params: { month?: string; type?: "expense" | "income" }) =>
    apiClient.get<{ data: Expense[]; total: number }>("/finance/transactions", { params }).then((r) => r.data),

  createTransaction: (data: Partial<Expense> & {
    date: string;
    description: string;
    amount: number;
    type: "expense" | "income";
    categoryId?: string | null;
  }) => apiClient.post<Expense>("/finance/transactions", data).then((r) => r.data),

  updateTransaction: (id: string, data: Partial<Expense> & { categoryId?: string | null }) =>
    apiClient.patch<Expense>(`/finance/transactions/${id}`, data).then((r) => r.data),

  deleteTransaction: (id: string) => apiClient.delete(`/finance/transactions/${id}`),

  categories: (params?: { type?: "expense" | "income" }) =>
    apiClient.get<UserCategory[]>("/finance/categories", { params }).then((r) => r.data),

  summary: (month: string) =>
    apiClient.get<FinanceSummary>("/finance/summary", { params: { month } }).then((r) => r.data),
};
