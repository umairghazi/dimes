import { Expense } from "../types/prisma.types";
import { ExpenseFilters, ExpenseRepository } from "../repositories/expense.repository";
import { AppError } from "../errors/AppError";
import { PaginatedResult } from "../types/common.types";
import { cache } from "../lib/cache";

export interface CreateExpenseDto {
  date: string;
  description: string;
  amount: number;
  currency: string;
  category: string;
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
  category?: string;
  subCategory?: string;
  merchantName?: string;
  isRecurring?: boolean;
  tags?: string[];
}

export class ExpenseService {
  constructor(private readonly expenseRepo: ExpenseRepository) {}

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

  async createExpense(userId: string, dto: CreateExpenseDto): Promise<Expense> {
    const result = await this.expenseRepo.create({
      ...dto,
      userId,
      date: new Date(dto.date),
      isRecurring: dto.isRecurring ?? false,
      tags: dto.tags ?? [],
    }) as Expense;
    this.invalidateAnalytics(userId);
    return result;
  }

  async updateExpense(userId: string, id: string, dto: UpdateExpenseDto): Promise<Expense> {
    await this.getExpenseById(userId, id); // ownership check
    const result = await this.expenseRepo.updateById(id, {
      ...dto,
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
