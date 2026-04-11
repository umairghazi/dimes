import { ExpenseRepository } from "../repositories/expense.repository";
import { BudgetRepository } from "../repositories/budget.repository";
import { getAIProvider } from "../ai/AIProviderFactory";
import { AnalyticsData } from "../ai/interfaces/AITypes";
import { logger } from "../config/logger";
import { cache, TTL } from "../lib/cache";

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

export interface BudgetComparisonRow {
  category: string;
  planned: number;
  actual: number;
  diff: number;
}

export interface BudgetComparison {
  monthYear: string;
  totals: { planned: number; actual: number; diff: number };
  rows: BudgetComparisonRow[];
}

export class AnalyticsService {
  constructor(
    private readonly expenseRepo: ExpenseRepository,
    private readonly budgetRepo: BudgetRepository,
  ) {}

  async getMonthlySummary(userId: string, monthYear: string): Promise<MonthlySummary> {
    const cacheKey = `analytics:${userId}:summary:${monthYear}`;
    const cached = cache.get<MonthlySummary>(cacheKey);
    if (cached) return cached;

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

    const result: MonthlySummary = {
      period: monthYear,
      totalSpend,
      totalIncome,
      netSavings: totalIncome - totalSpend,
      byCategory,
    };
    cache.set(cacheKey, result, TTL.ANALYTICS);
    return result;
  }

  async getTrends(userId: string, months: number = 6): Promise<MonthlySummary[]> {
    const cacheKey = `analytics:${userId}:trends:${months}`;
    const cached = cache.get<MonthlySummary[]>(cacheKey);
    if (cached) return cached;

    const now = new Date();
    const monthYears = Array.from({ length: months }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (months - 1 - i), 1);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    });
    const results = await Promise.all(monthYears.map((m) => this.getMonthlySummary(userId, m)));
    cache.set(cacheKey, results, TTL.ANALYTICS);
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

  async getBudgetComparison(userId: string, monthYear: string): Promise<BudgetComparison> {
    const cacheKey = `analytics:${userId}:budget-comparison:${monthYear}`;
    const cached = cache.get<BudgetComparison>(cacheKey);
    if (cached) return cached;

    const [year, month] = monthYear.split("-").map(Number);
    const from = new Date(year, month - 1, 1);
    const to = new Date(year, month, 0, 23, 59, 59);

    const [spendData, budgets] = await Promise.all([
      this.expenseRepo.aggregateByCategory(userId, from, to),
      this.budgetRepo.findByUserAndMonth(userId, monthYear),
    ]);

    const spendMap = new Map(spendData.map((c) => [c.category, c.total]));
    const budgetMap = new Map(budgets.map((b) => [b.category, b.limitAmount]));

    const allCategories = new Set([...budgetMap.keys(), ...spendMap.keys()]);

    // Exclude income entries — those are handled by getIncomeBreakdown
    const expenseCategories = Array.from(allCategories).filter(
      (c) => c !== "Income" && !c.startsWith("Income - "),
    );

    const rows: BudgetComparisonRow[] = expenseCategories
      .sort()
      .map((category) => {
        const planned = budgetMap.get(category) ?? 0;
        const actual = spendMap.get(category) ?? 0;
        return { category, planned, actual, diff: planned - actual };
      });

    const totalPlanned = rows.reduce((s, r) => s + r.planned, 0);
    const totalActual = rows.reduce((s, r) => s + r.actual, 0);

    const result: BudgetComparison = {
      monthYear,
      totals: { planned: totalPlanned, actual: totalActual, diff: totalPlanned - totalActual },
      rows,
    };
    cache.set(cacheKey, result, TTL.ANALYTICS);
    return result;
  }

  async getIncomeBreakdown(userId: string, monthYear: string): Promise<BudgetComparison> {
    const cacheKey = `analytics:${userId}:income-breakdown:${monthYear}`;
    const cached = cache.get<BudgetComparison>(cacheKey);
    if (cached) return cached;

    const [year, month] = monthYear.split("-").map(Number);
    const from = new Date(year, month - 1, 1);
    const to = new Date(year, month, 0, 23, 59, 59);

    const [incomeData, budgets] = await Promise.all([
      this.expenseRepo.aggregateBySubCategory(userId, from, to, true),
      this.budgetRepo.findByUserAndMonth(userId, monthYear),
    ]);

    // Income budgets are stored as "Income - Paycheck", "Income - Bonus", etc.
    const incomeBudgets = budgets.filter((b) => b.category.startsWith("Income - "));
    const budgetMap = new Map(
      incomeBudgets.map((b) => [b.category.replace("Income - ", ""), b.limitAmount]),
    );
    const actualMap = new Map(incomeData.map((c) => [c.subCategory, c.total]));

    const allSources = new Set([...budgetMap.keys(), ...actualMap.keys()]);
    const rows: BudgetComparisonRow[] = Array.from(allSources)
      .sort()
      .map((source) => {
        const planned = budgetMap.get(source) ?? 0;
        const actual = actualMap.get(source) ?? 0;
        // For income: positive diff = earned more than planned (good)
        return { category: source, planned, actual, diff: actual - planned };
      });

    const totalPlanned = rows.reduce((s, r) => s + r.planned, 0);
    const totalActual = rows.reduce((s, r) => s + r.actual, 0);

    const result: BudgetComparison = {
      monthYear,
      totals: { planned: totalPlanned, actual: totalActual, diff: totalActual - totalPlanned },
      rows,
    };
    cache.set(cacheKey, result, TTL.ANALYTICS);
    return result;
  }

  async getRecurringTransactions(userId: string): Promise<unknown[]> {
    const cacheKey = `analytics:${userId}:recurring`;
    const cached = cache.get<unknown[]>(cacheKey);
    if (cached) return cached;

    const result = await this.expenseRepo.findMany({ userId, isRecurring: true });
    cache.set(cacheKey, result, TTL.RECURRING);
    return result;
  }

  invalidateUser(userId: string): void {
    cache.delPrefix(`analytics:${userId}:`);
  }

  async generateInsight(userId: string, monthYear: string): Promise<string> {
    const summary = await this.getMonthlySummary(userId, monthYear);
    const analyticsData: AnalyticsData = {
      period: summary.period,
      totalSpend: summary.totalSpend,
      byCategory: summary.byCategory.map((c) => ({
        category: c.category,
        amount: c.amount,
        count: c.count,
      })),
    };
    const start = Date.now();
    const result = await getAIProvider().generateInsight(analyticsData);
    logger.info({ durationMs: Date.now() - start }, "ai: generateInsight");
    return result;
  }
}
