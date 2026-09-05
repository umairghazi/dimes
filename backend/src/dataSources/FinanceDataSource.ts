export type FinanceProviderName = "google-sheets";
export type FinanceTransactionType = "expense" | "income";

export interface FinanceTransaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  category: string;
  mainCategory: string;
  type: FinanceTransactionType;
  source: FinanceProviderName;
}

export interface FinanceTransactionFilters {
  month?: string;
  type?: FinanceTransactionType;
}

export interface FinanceDataSourceStatus {
  provider: FinanceProviderName;
  configured: boolean;
  readOnly: boolean;
  details?: Record<string, string | number | boolean | null>;
}

export interface FinanceDataSource {
  status(): FinanceDataSourceStatus;
  listTransactions(userId: string, filters?: FinanceTransactionFilters): Promise<FinanceTransaction[]>;
}
