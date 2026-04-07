import { ExpenseRepository } from "../repositories/expense.repository";
import { BudgetRepository } from "../repositories/budget.repository";
import { getAIProvider } from "../ai/AIProviderFactory";
import { AnalyticsData } from "../ai/interfaces/AITypes";
import { ExpenseCategory } from "../types/common.types";

export interface MonthlySummary {
  period: string;
  totalSpend: number;
  totalIncome: number;
  netSavings: number;
  byCategory: Array<{ category: string; amount: number; count: number; budgetLimit?: number; budgetPercent?: number }>;
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

export class AnalyticsService {
  constructor(
    private readonly expenseRepo: ExpenseRepository,
    private readonly budgetRepo: BudgetRepository,
  ) {}

  async getMonthlySummary(userId: string, monthYear: string): Promise<MonthlySummary> {
    const [year, month] = monthYear.split("-").map(Number);
    const from = new Date(year, month - 1, 1);
    const to = new Date(year, month, 0, 23, 59, 59);

    const [categories, budgets] = await Promise.all([
      this.expenseRepo.aggregateByCategory(userId, from, to),
      this.budgetRepo.findByUserAndMonth(userId, monthYear),
    ]);

    const budgetMap = new Map(budgets.map((b) => [b.category, b]));

    const totalSpend = categories
      .filter((c) => c.category !== "Income")
      .reduce((sum, c) => sum + c.total, 0);
    const totalIncome = categories
      .filter((c) => c.category === "Income")
      .reduce((sum, c) => sum + c.total, 0);

    const byCategory = categories.map((c) => {
      const budget = budgetMap.get(c.category);
      return {
        category: c.category,
        amount: c.total,
        count: c.count,
        budgetLimit: budget?.limitAmount,
        budgetPercent: budget ? (c.total / budget.limitAmount) * 100 : undefined,
      };
    });

    return {
      period: monthYear,
      totalSpend,
      totalIncome,
      netSavings: totalIncome - totalSpend,
      byCategory,
    };
  }

  async getTrends(userId: string, months: number = 6): Promise<MonthlySummary[]> {
    const results: MonthlySummary[] = [];
    const now = new Date();
    for (let i = months - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthYear = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      results.push(await this.getMonthlySummary(userId, monthYear));
    }
    return results;
  }

  async getBudgetProgress(userId: string, monthYear: string): Promise<BudgetProgress[]> {
    const [year, month] = monthYear.split("-").map(Number);
    const from = new Date(year, month - 1, 1);
    const to = new Date(year, month, 0, 23, 59, 59);

    const [categories, budgets] = await Promise.all([
      this.expenseRepo.aggregateByCategory(userId, from, to),
      this.budgetRepo.findByUserAndMonth(userId, monthYear),
    ]);

    const spendMap = new Map(categories.map((c) => [c.category, c.total]));
    const now = new Date();
    const daysInMonth = new Date(year, month, 0).getDate();
    const daysRemaining = Math.max(0, daysInMonth - now.getDate());

    return budgets.map((b) => {
      const spent = spendMap.get(b.category) ?? 0;
      return {
        category: b.category,
        spent,
        limit: b.limitAmount,
        percent: (spent / b.limitAmount) * 100,
        currency: b.currency,
        daysRemaining,
        alertThreshold: b.alertThreshold,
      };
    });
  }

  async getRecurringTransactions(userId: string): Promise<unknown[]> {
    return this.expenseRepo.findMany({ userId, isRecurring: true });
  }

  async generateInsight(userId: string, monthYear: string): Promise<string> {
    const summary = await this.getMonthlySummary(userId, monthYear);
    const analyticsData: AnalyticsData = {
      period: summary.period,
      totalSpend: summary.totalSpend,
      byCategory: summary.byCategory.map((c) => ({
        category: c.category as ExpenseCategory,
        amount: c.amount,
        count: c.count,
      })),
    };
    return getAIProvider().generateInsight(analyticsData);
  }
}
