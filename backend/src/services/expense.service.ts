import { Expense } from "../types/prisma.types";
import { ExpenseFilters, ExpenseRepository } from "../repositories/expense.repository";
import { CategoryRepository } from "../repositories/category.repository";
import { AppError } from "../errors/AppError";
import { PaginatedResult } from "../types/common.types";
import { cache } from "../lib/cache";

export interface CreateExpenseDto {
  date: string;
  description: string;
  amount: number;
  currency: string;
  categoryId?: string;   // preferred: FK to UserCategory
  category?: string;     // fallback: used for Income / legacy
  subCategory?: string;
  merchantName?: string;
  source: "manual" | "csv-upload";
  isRecurring?: boolean;
  tags?: string[];
  originalDescription?: string;
}

export interface UpdateExpenseDto {
  date?: string;
  description?: string;
  amount?: number;
  currency?: string;
  categoryId?: string;
  category?: string;
  subCategory?: string;
  merchantName?: string;
  isRecurring?: boolean;
  tags?: string[];
}

export class ExpenseService {
  constructor(
    private readonly expenseRepo: ExpenseRepository,
    private readonly categoryRepo: CategoryRepository,
  ) {}

  private invalidateAnalytics(userId: string): void {
    cache.delPrefix(`analytics:${userId}:`);
  }

  async getExpenses(
    userId: string,
    filters: Omit<ExpenseFilters, "userId">,
    page = 1,
    limit = 20,
  ): Promise<PaginatedResult<Expense>> {
    const fullFilters: ExpenseFilters = { ...filters, userId };
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.expenseRepo.filterExpenses(fullFilters, skip, limit),
      this.expenseRepo.countFiltered(fullFilters),
    ]);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getExpenseById(userId: string, id: string): Promise<Expense> {
    const expense = await this.expenseRepo.getById(id);
    if (!expense) throw new AppError("Expense not found", 404, "NOT_FOUND");
    if (expense.userId !== userId) throw new AppError("Forbidden", 403, "FORBIDDEN");
    return expense;
  }

  private async resolveCategoryFields(
    userId: string,
    categoryId?: string,
    categoryName?: string,
  ): Promise<{ category: string; categoryId: string | null }> {
    if (categoryId) {
      const cat = await this.categoryRepo.getById(categoryId);
      if (!cat || cat.userId !== userId) throw new AppError("Category not found", 404, "NOT_FOUND");
      return { category: cat.name, categoryId };
    }
    if (categoryName) return { category: categoryName, categoryId: null };
    throw new AppError("categoryId or category is required", 400, "VALIDATION_ERROR");
  }

  async createExpense(userId: string, dto: CreateExpenseDto): Promise<Expense> {
    const { category, categoryId } = await this.resolveCategoryFields(userId, dto.categoryId, dto.category);
    const result = await this.expenseRepo.create({
      ...dto,
      userId,
      category,
      categoryId,
      date: new Date(dto.date),
      isRecurring: dto.isRecurring ?? false,
      tags: dto.tags ?? [],
    }) as Expense;
    this.invalidateAnalytics(userId);
    return result;
  }

  async updateExpense(userId: string, id: string, dto: UpdateExpenseDto): Promise<Expense> {
    await this.getExpenseById(userId, id); // ownership check
    let categoryFields: { category?: string; categoryId?: string | null } = {};
    if (dto.categoryId !== undefined || dto.category !== undefined) {
      const resolved = await this.resolveCategoryFields(userId, dto.categoryId, dto.category);
      categoryFields = resolved;
    }
    const result = await this.expenseRepo.updateById(id, {
      ...dto,
      ...categoryFields,
      ...(dto.date ? { date: new Date(dto.date) } : {}),
    }) as Expense;
    this.invalidateAnalytics(userId);
    return result;
  }

  async deleteExpense(userId: string, id: string): Promise<void> {
    await this.getExpenseById(userId, id); // ownership check
    await this.expenseRepo.deleteById(id);
    this.invalidateAnalytics(userId);
  }
}
