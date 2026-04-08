import { apiClient } from "./client";
import { Budget, CreateBudgetDto, UpdateBudgetDto } from "@/types/budget.types";

export const budgetsApi = {
  list: () => apiClient.get<Budget[]>("/budgets").then((r) => r.data),

  create: (data: CreateBudgetDto) =>
    apiClient.post<Budget>("/budgets", data).then((r) => r.data),

  update: (id: string, data: UpdateBudgetDto) =>
    apiClient.patch<Budget>(`/budgets/${id}`, data).then((r) => r.data),

  delete: (id: string) => apiClient.delete(`/budgets/${id}`),

  rollover: (monthYear: string) =>
    apiClient.post<{ created: number; budgets: Budget[] }>("/budgets/rollover", { monthYear }).then((r) => r.data),
};
