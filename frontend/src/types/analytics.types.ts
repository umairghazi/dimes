export interface CategorySummary {
  category: string;
  amount: number;
  count: number;
  budgetLimit?: number;
  budgetPercent?: number;
}

export interface MonthlySummary {
  period: string;
  totalSpend: number;
  totalIncome: number;
  netSavings: number;
  byCategory: CategorySummary[];
}

export interface BudgetProgress {
  category: string;
  spent: number;
  limit: number;
  percent: number;
  currency: string;
  daysRemaining: number;
  alertThreshold: number;
}
