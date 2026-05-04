import { BalanceRepository } from "../repositories/balance.repository";
import { ExpenseRepository } from "../repositories/expense.repository";

export interface MonthlyBalanceSummary {
  monthYear: string;
  startingBalance: number;
  endingBalance: number | null;          // user-entered actual bank balance (optional)
  computedEndingBalance: number;          // startingBalance + income - totalSpent
  income: number;
  totalSpent: number;
  savingsIncomeBased: number;            // income - totalSpent
  savingsBalanceBased: number | null;    // endingBalance - startingBalance (if endingBalance set)
  currency: string;
}

function monthBounds(monthYear: string): { from: Date; to: Date } {
  const [year, month] = monthYear.split("-").map(Number);
  const from = new Date(Date.UTC(year, month - 1, 1));
  const to = new Date(Date.UTC(year, month, 1) - 1);
  return { from, to };
}

export class BalanceService {
  constructor(
    private readonly balanceRepo: BalanceRepository,
    private readonly expenseRepo: ExpenseRepository,
  ) {}

  async getMonthlyBalance(userId: string, monthYear: string): Promise<MonthlyBalanceSummary> {
    const { from, to } = monthBounds(monthYear);

    const [balance, categories] = await Promise.all([
      this.balanceRepo.findByUserAndMonth(userId, monthYear),
      this.expenseRepo.aggregateByCategory(userId, from, to),
    ]);

    const totalSpent = categories
      .filter((c) => c.type === "expense")
      .reduce((sum, c) => sum + c.total, 0);
    const income = categories
      .filter((c) => c.type === "income")
      .reduce((sum, c) => sum + c.total, 0);

    const startingBalance = balance?.startingBalance ?? 0;
    const endingBalance = balance?.endingBalance ?? null;
    const computedEndingBalance = startingBalance + income - totalSpent;
    const savingsIncomeBased = income - totalSpent;
    const savingsBalanceBased = endingBalance !== null ? endingBalance - startingBalance : null;

    return {
      monthYear,
      startingBalance,
      endingBalance,
      computedEndingBalance,
      income,
      totalSpent,
      savingsIncomeBased,
      savingsBalanceBased,
      currency: balance?.currency ?? "CAD",
    };
  }

  async upsertBalance(
    userId: string,
    monthYear: string,
    startingBalance: number,
    endingBalance: number | null | undefined,
    currency: string,
  ): Promise<MonthlyBalanceSummary> {
    await this.balanceRepo.upsert(userId, monthYear, {
      startingBalance,
      endingBalance: endingBalance ?? null,
      currency,
    });
    return this.getMonthlyBalance(userId, monthYear);
  }
}
