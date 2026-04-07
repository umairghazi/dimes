import { ExpenseCategory } from "../../types/common.types";

export interface RawTransaction {
  date: string;
  description: string;
  amount: number;
}

export interface ClassifiedTransaction extends RawTransaction {
  category: ExpenseCategory;
  subCategory?: string;
  merchantName?: string;
  isRecurring: boolean;
  confidence: number;
}

export interface UserContext {
  userId: string;
  preferredCurrency?: string;
  recentCategories?: ExpenseCategory[];
}

export interface StructuredQuery {
  metric: "total_spend" | "average_spend" | "count" | "list";
  category?: ExpenseCategory;
  period?: string; // "2025-03" | "last_30_days" etc.
  dateFrom?: string;
  dateTo?: string;
  merchantName?: string;
}

export interface AnalyticsData {
  period: string;
  totalSpend: number;
  byCategory: Array<{ category: ExpenseCategory; amount: number; count: number }>;
  topMerchants?: Array<{ name: string; amount: number }>;
}

export interface ParsedNLTransaction {
  amount: number;
  description: string;
  category: ExpenseCategory;
  date: string; // ISO date string
  merchantName?: string;
}
