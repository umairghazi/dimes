import { apiClient } from "./client";

export interface MonthlyBalanceSummary {
  monthYear: string;
  startingBalance: number;
  endingBalance: number | null;
  computedEndingBalance: number;
  income: number;
  totalSpent: number;
  savingsIncomeBased: number;
  savingsBalanceBased: number | null;
  currency: string;
}

export const balanceApi = {
  get: (month?: string) =>
    apiClient
      .get<MonthlyBalanceSummary>("/balance", { params: month ? { month } : undefined })
      .then((r) => r.data),

  upsert: (body: {
    monthYear: string;
    startingBalance: number;
    endingBalance?: number | null;
    currency?: string;
  }) => apiClient.put<MonthlyBalanceSummary>("/balance", body).then((r) => r.data),
};
