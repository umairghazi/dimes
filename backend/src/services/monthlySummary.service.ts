import { MonthlyBalanceRepository } from "../repositories/monthlyBalance.repository";
import { MonthlyPlanRepository } from "../repositories/monthlyPlan.repository";
import { TransactionRepository } from "../repositories/transaction.repository";
import { CategoryRepository } from "../repositories/category.repository";
import { FinanceCategory, FinanceTransaction, expenseAmount } from "../types/finance.types";
import { MonthlySummary, YearlySummary } from "../types/finance.types";

function monthLabel(monthYear: string): string {
  const [, month] = monthYear.split("-").map(Number);
  return new Date(Date.UTC(2000, month - 1, 1)).toLocaleString("en-US", { month: "short", timeZone: "UTC" });
}

export class MonthlySummaryService {
  constructor(
    private readonly transactionRepo: TransactionRepository,
    private readonly monthlyPlanRepo: MonthlyPlanRepository,
    private readonly monthlyBalanceRepo: MonthlyBalanceRepository,
    private readonly categoryRepo: CategoryRepository,
  ) {}

  async get(userId: string, month: string): Promise<MonthlySummary> {
    const [transactions, plans, balance] = await Promise.all([
      this.transactionRepo.listByUser(userId, { month }),
      this.monthlyPlanRepo.listByMonth(userId, month),
      this.monthlyBalanceRepo.getByMonth(userId, month),
    ]);

    return { transactions, plans, balance };
  }

  async listPlans(userId: string, month: string) {
    return this.monthlyPlanRepo.listByMonth(userId, month);
  }

  async upsertPlan(userId: string, data: {
    monthYear: string;
    categoryId?: string | null;
    categoryName: string;
    type: "expense" | "income";
    plannedAmount: number;
    currency?: string;
    carryForward?: boolean;
  }) {
    return this.monthlyPlanRepo.upsert(userId, data);
  }

  async deletePlan(userId: string, id: string) {
    return this.monthlyPlanRepo.delete(userId, id);
  }

  async getBalance(userId: string, month: string) {
    return this.monthlyBalanceRepo.getByMonth(userId, month);
  }

  async upsertBalance(userId: string, data: {
    monthYear: string;
    startingBalance: number;
    endingBalance?: number | null;
    currency?: string;
  }) {
    return this.monthlyBalanceRepo.upsert(userId, data);
  }

  async getYear(userId: string, year: number): Promise<YearlySummary> {
    const [transactions, balances, categories] = await Promise.all([
      this.transactionRepo.listByYear(userId, year),
      this.monthlyBalanceRepo.listByYear(userId, year),
      this.categoryRepo.listByUser(userId, "expense"),
    ]);
    const balancesByMonth = new Map(balances.map((balance) => [balance.monthYear, balance]));
    const categoriesById = new Map(categories.map((category) => [category.id, category]));

    const months = Array.from({ length: 12 }, (_, index) => {
      const monthYear = `${year}-${String(index + 1).padStart(2, "0")}`;
      const monthTransactions = transactions.filter((transaction) => transaction.monthYear === monthYear);
      const income = monthTransactions
        .filter((transaction) => transaction.type === "income")
        .reduce((sum, transaction) => sum + transaction.amount, 0);
      const expenses = monthTransactions
        .reduce((sum, transaction) => sum + expenseAmount(transaction), 0);
      const net = income - expenses;
      const balance = balancesByMonth.get(monthYear);
      const startingBalance = balance?.startingBalance ?? null;
      const endingBalance = balance ? balance.endingBalance ?? balance.startingBalance + net : null;

      return {
        monthYear,
        monthLabel: monthLabel(monthYear),
        income,
        expenses,
        net,
        startingBalance,
        endingBalance,
      };
    });

    const totals = months.reduce(
      (sum, month) => ({
        income: sum.income + month.income,
        expenses: sum.expenses + month.expenses,
        net: sum.net + month.net,
      }),
      { income: 0, expenses: 0, net: 0 },
    );

    return {
      year,
      months,
      categorySpend: this.buildYearlyCategorySpend(transactions, categoriesById),
      totals,
    };
  }

  private buildYearlyCategorySpend(
    transactions: FinanceTransaction[],
    categoriesById: Map<string, FinanceCategory>,
  ): YearlySummary["categorySpend"] {
    const rows = new Map<string, YearlySummary["categorySpend"][number]>();

    transactions
      .filter((transaction) => transaction.type !== "income")
      .forEach((transaction) => {
        const category = transaction.categoryId ? categoriesById.get(transaction.categoryId) : null;
        const path = category?.path.length ? category.path : [{ id: "uncategorized", name: "Uncategorized" }];

        path.forEach((part, index) => {
          const key = part.id;
          const existing = rows.get(key);
          if (existing) {
            existing.amount += expenseAmount(transaction);
            existing.count += 1;
            return;
          }

          rows.set(key, {
            categoryId: part.id === "uncategorized" ? null : part.id,
            categoryName: part.name,
            categoryPath: path.slice(0, index + 1),
            amount: expenseAmount(transaction),
            count: 1,
            depth: index,
          });
        });
      });

    return [...rows.values()].sort((a, b) => b.amount - a.amount || a.categoryName.localeCompare(b.categoryName));
  }
}
