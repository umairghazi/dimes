import { MonthlyBalanceRepository } from "../repositories/monthlyBalance.repository";
import { MonthlyPlanRepository } from "../repositories/monthlyPlan.repository";
import { TransactionRepository } from "../repositories/transaction.repository";
import { MonthlySummary } from "../types/finance.types";

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
}
