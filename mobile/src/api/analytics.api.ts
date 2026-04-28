import { apiClient } from "./client";
import { MonthlySummary, BudgetComparison, MerchantTotal } from "@/types/analytics.types";

export const analyticsApi = {
  getSummary: (month?: string) =>
    apiClient.get<MonthlySummary>("/analytics/summary", { params: { month } }).then((r) => r.data),

  getBudgetComparison: (month?: string) =>
    apiClient.get<BudgetComparison>("/analytics/budget-comparison", { params: { month } }).then((r) => r.data),

  getTrends: () =>
    apiClient.get<MonthlySummary[]>("/analytics/trends").then((r) => r.data),

  getMerchants: (month?: string) =>
    apiClient.get<MerchantTotal[]>("/analytics/merchants", { params: { month } }).then((r) => r.data),
};
