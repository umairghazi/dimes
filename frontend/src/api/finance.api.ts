import { apiClient } from "./client";
import { Expense } from "@/types/expense.types";

export interface FinanceCategory {
  id: string;
  userId: string;
  name: string;
  mainCategory: string | null;
  type: "expense" | "income";
  isFixed: boolean;
  sortOrder: number;
}

export interface CategoryInput {
  name: string;
  mainCategory?: string | null;
  type?: "expense" | "income";
  isFixed?: boolean;
  sortOrder?: number;
}

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
    apiClient.get<FinanceCategory[]>("/finance/categories", { params }).then((r) => r.data),

  createCategory: (data: CategoryInput) =>
    apiClient.post<FinanceCategory>("/finance/categories", data).then((r) => r.data),

  updateCategory: (id: string, data: Partial<CategoryInput>) =>
    apiClient.patch<FinanceCategory>(`/finance/categories/${id}`, data).then((r) => r.data),

  deleteCategory: (id: string) => apiClient.delete(`/finance/categories/${id}`),

  monthlyPlans: (month: string) =>
    apiClient.get<MonthlyPlan[]>("/finance/plans", { params: { month } }).then((r) => r.data),

  monthlyBalance: (month: string) =>
    apiClient.get<MonthlyBalance | null>("/finance/balance", { params: { month } }).then((r) => r.data),

  summary: (month: string) =>
    apiClient.get<FinanceSummary>("/finance/summary", { params: { month } }).then((r) => r.data),
};
