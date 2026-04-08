import { Budget } from "../types/prisma.types";
import { BudgetRepository } from "../repositories/budget.repository";
import { AppError } from "../errors/AppError";

export interface CreateBudgetDto {
  category: string;
  monthYear: string;
  limitAmount: number;
  currency: string;
  alertThreshold?: number;
  carryForward?: boolean;
}

export interface UpdateBudgetDto {
  limitAmount?: number;
  alertThreshold?: number;
  carryForward?: boolean;
}

export class BudgetService {
  constructor(private readonly budgetRepo: BudgetRepository) {}

  async getBudgets(userId: string): Promise<Budget[]> {
    return this.budgetRepo.findAllByUser(userId);
  }

  async getBudgetById(userId: string, id: string): Promise<Budget> {
    const budget = await this.budgetRepo.getById(id);
    if (!budget) throw new AppError("Budget not found", 404, "NOT_FOUND");
    if (budget.userId !== userId) throw new AppError("Forbidden", 403, "FORBIDDEN");
    return budget;
  }

  async createBudget(userId: string, dto: CreateBudgetDto): Promise<Budget> {
    const existing = await this.budgetRepo.findByUserCategoryMonth(
      userId,
      dto.category,
      dto.monthYear,
    );
    if (existing) {
      throw new AppError(
        `Budget for ${dto.category} in ${dto.monthYear} already exists`,
        409,
        "BUDGET_EXISTS",
      );
    }
    return this.budgetRepo.create({
      ...dto,
      userId,
      alertThreshold: dto.alertThreshold ?? 0.8,
      carryForward: dto.carryForward ?? false,
    }) as Promise<Budget>;
  }

  async rolloverBudgets(userId: string, targetMonth: string): Promise<Budget[]> {
    const [year, month] = targetMonth.split("-").map(Number);
    const prevDate = new Date(year, month - 2); // month is 1-indexed, so -2 gives previous month
    const prevMonth = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, "0")}`;

    const sources = await this.budgetRepo.findCarryForwardByMonth(userId, prevMonth);
    if (sources.length === 0) return [];

    const created: Budget[] = [];
    for (const src of sources) {
      const existing = await this.budgetRepo.findByUserCategoryMonth(userId, src.category, targetMonth);
      if (existing) continue;
      const budget = await this.budgetRepo.create({
        userId,
        category: src.category,
        monthYear: targetMonth,
        limitAmount: src.limitAmount,
        currency: src.currency,
        alertThreshold: src.alertThreshold,
        carryForward: true,
      }) as Budget;
      created.push(budget);
    }
    return created;
  }

  async updateBudget(userId: string, id: string, dto: UpdateBudgetDto): Promise<Budget> {
    await this.getBudgetById(userId, id); // ownership check
    return this.budgetRepo.updateById(id, dto as Record<string, unknown>) as Promise<Budget>;
  }

  async deleteBudget(userId: string, id: string): Promise<void> {
    await this.getBudgetById(userId, id); // ownership check
    await this.budgetRepo.deleteById(id);
  }
}
