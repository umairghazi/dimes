export type FinanceProviderName = "db" | "google-sheets";
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

export interface FinanceTransactionResponse {
  data: FinanceTransaction[];
  total: number;
}

export interface FinanceStatus {
  provider: FinanceProviderName;
  configured: boolean;
  readOnly: boolean;
  details?: Record<string, string | number | boolean | null>;
}
