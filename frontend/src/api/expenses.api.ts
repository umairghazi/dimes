import { apiClient } from "./client";
import { Expense, ExpenseFilters, PaginatedExpenses } from "@/types/expense.types";

export const expensesApi = {
  list: (params: ExpenseFilters & { page?: number; limit?: number }) =>
    apiClient.get<PaginatedExpenses>("/expenses", { params }).then((r) => r.data),

  getById: (id: string) =>
    apiClient.get<Expense>(`/expenses/${id}`).then((r) => r.data),

  create: (data: Omit<Expense, "id" | "userId" | "createdAt" | "updatedAt">) =>
    apiClient.post<Expense>("/expenses", data).then((r) => r.data),

  update: (id: string, data: Partial<Expense>) =>
    apiClient.patch<Expense>(`/expenses/${id}`, data).then((r) => r.data),

  delete: (id: string) =>
    apiClient.delete(`/expenses/${id}`),
};
