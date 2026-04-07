export interface RawTransaction {
  date: string;
  description: string;
  amount: number;
}

export interface ClassifiedTransaction extends RawTransaction {
  category: string;
  subCategory?: string;
  merchantName?: string;
  isRecurring: boolean;
  confidence: number;
}

export interface UserContext {
  userId: string;
  preferredCurrency?: string;
  recentCategories?: string[];
  availableCategories?: string[];
}

export interface StructuredQuery {
  metric: "total_spend" | "average_spend" | "count" | "list";
  category?: string;
  period?: string;
  dateFrom?: string;
  dateTo?: string;
  merchantName?: string;
}

export interface AnalyticsData {
  period: string;
  totalSpend: number;
  byCategory: Array<{ category: string; amount: number; count: number }>;
  topMerchants?: Array<{ name: string; amount: number }>;
}

export interface ParsedNLTransaction {
  amount: number;
  description: string;
  category: string;
  date: string;
  merchantName?: string;
}
