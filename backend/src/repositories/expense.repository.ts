import { Expense } from "../types/prisma.types";
import { prisma } from "../config/db";
import { BaseMongoRepository } from "../base/BaseMongoRepository";
import { RepositoryError } from "../errors/RepositoryError";

export interface ExpenseFilters {
  userId: string;
  category?: string;
  dateFrom?: Date;
  dateTo?: Date;
  source?: string;
  isRecurring?: boolean;
  search?: string;
}

export class ExpenseRepository extends BaseMongoRepository<Expense> {
  constructor() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    super(prisma.expense as any);
  }

  // Always scoped by userId - enforced at repo layer, not just service layer
  async findByUserId(
    userId: string,
    skip?: number,
    take?: number,
  ): Promise<Expense[]> {
    return this.getAll({ userId }, skip, take);
  }

  async findByDateRange(userId: string, from: Date, to: Date): Promise<Expense[]> {
    try {
      return await prisma.expense.findMany({
        where: { userId, date: { gte: from, lte: to } },
        orderBy: { date: "desc" },
      });
    } catch (err) {
      throw new RepositoryError("Failed to findByDateRange", "findByDateRange", err);
    }
  }

  async filterExpenses(filters: ExpenseFilters, skip?: number, take?: number): Promise<Expense[]> {
    try {
      const where: Record<string, unknown> = { userId: filters.userId };
      if (filters.category) where.category = filters.category;
      if (filters.source) where.source = filters.source;
      if (filters.isRecurring !== undefined) where.isRecurring = filters.isRecurring;
      if (filters.dateFrom || filters.dateTo) {
        where.date = {};
        if (filters.dateFrom) (where.date as Record<string, unknown>).gte = filters.dateFrom;
        if (filters.dateTo) (where.date as Record<string, unknown>).lte = filters.dateTo;
      }
      if (filters.search) {
        where.description = { contains: filters.search, mode: "insensitive" };
      }
      return await prisma.expense.findMany({
        where: where as never,
        skip,
        take,
        orderBy: { date: "desc" },
      });
    } catch (err) {
      throw new RepositoryError("Failed to filterExpenses", "filterExpenses", err);
    }
  }

  async countFiltered(filters: ExpenseFilters): Promise<number> {
    try {
      const where: Record<string, unknown> = { userId: filters.userId };
      if (filters.category) where.category = filters.category;
      if (filters.source) where.source = filters.source;
      if (filters.isRecurring !== undefined) where.isRecurring = filters.isRecurring;
      if (filters.dateFrom || filters.dateTo) {
        where.date = {};
        if (filters.dateFrom) (where.date as Record<string, unknown>).gte = filters.dateFrom;
        if (filters.dateTo) (where.date as Record<string, unknown>).lte = filters.dateTo;
      }
      if (filters.search) {
        where.description = { contains: filters.search, mode: "insensitive" };
      }
      return await prisma.expense.count({
        where: where as never,
      });
    } catch (err) {
      throw new RepositoryError("Failed to countFiltered", "countFiltered", err);
    }
  }

  async aggregateByCategory(
    userId: string,
    from: Date,
    to: Date,
  ): Promise<Array<{ category: string; total: number; count: number }>> {
    try {
      const expenses = await prisma.expense.findMany({
        where: { userId, date: { gte: from, lte: to } },
        select: { category: true, amount: true },
      });

      const map = new Map<string, { total: number; count: number }>();
      for (const e of expenses) {
        const existing = map.get(e.category) ?? { total: 0, count: 0 };
        map.set(e.category, { total: existing.total + e.amount, count: existing.count + 1 });
      }

      return Array.from(map.entries()).map(([category, data]) => ({
        category,
        ...data,
      }));
    } catch (err) {
      throw new RepositoryError("Failed to aggregateByCategory", "aggregateByCategory", err);
    }
  }
}
