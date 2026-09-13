import { MonthlyBalanceRepository } from "../repositories/monthlyBalance.repository";
import { MonthlyPlanRepository } from "../repositories/monthlyPlan.repository";
import { TransactionRepository } from "../repositories/transaction.repository";
import { MonthlySummary, YearlySummary } from "../types/finance.types";

function monthLabel(monthYear: string): string {
  const [, month] = monthYear.split("-").map(Number);
  return new Date(Date.UTC(2000, month - 1, 1)).toLocaleString("en-US", { month: "short", timeZone: "UTC" });
}

export class MonthlySummaryService {
  constructor(
    private readonly transactionRepo = new TransactionRepository(),
    private readonly monthlyPlanRepo = new MonthlyPlanRepository(),
    private readonly monthlyBalanceRepo = new MonthlyBalanceRepository(),
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
    const [transactions, balances] = await Promise.all([
      this.transactionRepo.listByYear(userId, year),
      this.monthlyBalanceRepo.listByYear(userId, year),
    ]);
    const balancesByMonth = new Map(balances.map((balance) => [balance.monthYear, balance]));

    const months = Array.from({ length: 12 }, (_, index) => {
      const monthYear = `${year}-${String(index + 1).padStart(2, "0")}`;
      const monthTransactions = transactions.filter((transaction) => transaction.monthYear === monthYear);
      const income = monthTransactions
        .filter((transaction) => transaction.type === "income")
        .reduce((sum, transaction) => sum + transaction.amount, 0);
      const expenses = monthTransactions
        .filter((transaction) => transaction.type === "expense")
        .reduce((sum, transaction) => sum + transaction.amount, 0);
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

    return { year, months, totals };
  }
}
