import { apiClient } from "./client";
import { MonthlySummary, BudgetComparison } from "@/types/analytics.types";

export const analyticsApi = {
  getSummary: (month?: string) =>
    apiClient.get<MonthlySummary>("/analytics/summary", { params: { month } }).then((r) => r.data),

  getTrends: (months?: number) =>
    apiClient.get<MonthlySummary[]>("/analytics/trends", { params: { months } }).then((r) => r.data),

  getRecurring: () =>
    apiClient.get("/analytics/recurring").then((r) => r.data),

  getInsight: (month?: string) =>
    apiClient.get<{ insight: string }>("/analytics/insight", { params: { month } }).then((r) => r.data),

  getBudgetComparison: (month?: string) =>
    apiClient.get<BudgetComparison>("/analytics/budget-comparison", { params: { month } }).then((r) => r.data),
};
