import { apiClient } from "./client";
import { FinanceStatus, FinanceTransactionResponse, FinanceTransactionType } from "@/types/finance.types";

export const financeApi = {
  status: () =>
    apiClient.get<FinanceStatus>("/finance/status").then((r) => r.data),

  transactions: (params: { month?: string; type?: FinanceTransactionType }) =>
    apiClient.get<FinanceTransactionResponse>("/finance/transactions", { params }).then((r) => r.data),
};
