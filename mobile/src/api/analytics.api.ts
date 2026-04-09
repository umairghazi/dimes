import { apiClient } from "./client";
import { MonthlySummary, BudgetComparison } from "@/types/analytics.types";

export const analyticsApi = {
  getSummary: (month?: string) =>
    apiClient.get<MonthlySummary>("/analytics/summary", { params: { month } }).then((r) => r.data),

  getBudgetComparison: (month?: string) =>
    apiClient.get<BudgetComparison>("/analytics/budget-comparison", { params: { month } }).then((r) => r.data),
};
