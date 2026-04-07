import { Budget } from "../types/prisma.types";
import { BudgetRepository } from "../repositories/budget.repository";
import { AppError } from "../errors/AppError";

export interface CreateBudgetDto {
  category: string;
  monthYear: string;
  limitAmount: number;
  currency: string;
  alertThreshold?: number;
}

export interface UpdateBudgetDto {
  limitAmount?: number;
  alertThreshold?: number;
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
    return this.budgetRepo.create({ ...dto, userId, alertThreshold: dto.alertThreshold ?? 0.8 }) as Promise<Budget>;
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
