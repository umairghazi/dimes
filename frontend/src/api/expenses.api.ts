import { apiClient } from "./client";
import { Expense, ExpenseFilters, PaginatedExpenses } from "@/types/expense.types";

type CreateExpensePayload = Omit<Expense, "id" | "userId" | "createdAt" | "updatedAt" | "category" | "categoryId" | "isIncome"> & {
  categoryId?: string | null;
  isIncome?: boolean;
};

export const expensesApi = {
  list: (params: ExpenseFilters & { page?: number; limit?: number }) =>
    apiClient.get<PaginatedExpenses>("/expenses", { params }).then((r) => r.data),

  getById: (id: string) =>
    apiClient.get<Expense>(`/expenses/${id}`).then((r) => r.data),

  create: (data: CreateExpensePayload) =>
    apiClient.post<Expense>("/expenses", data).then((r) => r.data),

  update: (id: string, data: Partial<Expense> & { categoryId?: string | null }) =>
    apiClient.patch<Expense>(`/expenses/${id}`, data).then((r) => r.data),

  delete: (id: string) =>
    apiClient.delete(`/expenses/${id}`),
};
