import { Expense } from "../types/prisma.types";
import { prisma } from "../config/db";
import { BaseMongoRepository } from "../base/BaseMongoRepository";
import { RepositoryError } from "../errors/RepositoryError";

export interface ExpenseFilters {
  userId: string;
  categoryId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  source?: string;
  isRecurring?: boolean;
  search?: string;
}

type StoredExpense = Omit<Expense, "category"> & { categoryId?: string | null; isIncome: boolean };

export class ExpenseRepository extends BaseMongoRepository<Expense> {
  constructor() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    super(prisma.expense as any);
  }

  /** Batch-resolve categoryId → name. isIncome=true → "Income". No categoryId → "Uncategorized". */
  private async resolveNames(expenses: StoredExpense[]): Promise<(StoredExpense & { category: string })[]> {
    const ids = [...new Set(
      expenses.filter((e) => !e.isIncome && e.categoryId).map((e) => e.categoryId as string)
    )];
    const cats = ids.length
      ? await prisma.userCategory.findMany({ where: { id: { in: ids } }, select: { id: true, name: true } })
      : [];
    const nameMap = new Map(cats.map((c) => [c.id, c.name]));
    return expenses.map((e) => ({
      ...e,
      category: e.isIncome
        ? "Income"
        : e.categoryId
          ? (nameMap.get(e.categoryId) ?? "Uncategorized")
          : "Uncategorized",
    }));
  }

  async findByUserId(userId: string, skip?: number, take?: number): Promise<Expense[]> {
    const rows = (await this.getAll({ userId }, skip, take)) as StoredExpense[];
    return this.resolveNames(rows) as Promise<Expense[]>;
  }

  async findByDateRange(userId: string, from: Date, to: Date): Promise<Expense[]> {
    try {
      const rows = (await prisma.expense.findMany({
        where: { userId, date: { gte: from, lte: to } },
        orderBy: { date: "desc" },
      })) as StoredExpense[];
      return this.resolveNames(rows) as Promise<Expense[]>;
    } catch (err) {
      throw new RepositoryError("Failed to findByDateRange", "findByDateRange", err);
    }
  }

  async filterExpenses(filters: ExpenseFilters, skip?: number, take?: number): Promise<Expense[]> {
    try {
      const where = this.buildWhere(filters);
      const rows = (await prisma.expense.findMany({
        where: where as never,
        skip,
        take,
        orderBy: { date: "desc" },
      })) as StoredExpense[];
      return this.resolveNames(rows) as Promise<Expense[]>;
    } catch (err) {
      throw new RepositoryError("Failed to filterExpenses", "filterExpenses", err);
    }
  }

  async countFiltered(filters: ExpenseFilters): Promise<number> {
    try {
      return await prisma.expense.count({ where: this.buildWhere(filters) as never });
    } catch (err) {
      throw new RepositoryError("Failed to countFiltered", "countFiltered", err);
    }
  }

  private buildWhere(filters: ExpenseFilters): Record<string, unknown> {
    const where: Record<string, unknown> = { userId: filters.userId };
    if (filters.categoryId) where.categoryId = filters.categoryId;
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
    return where;
  }

  async aggregateByCategory(
    userId: string,
    from: Date,
    to: Date,
  ): Promise<Array<{ category: string; total: number; count: number }>> {
    try {
      const expenses = await prisma.expense.findMany({
        where: { userId, date: { gte: from, lte: to } },
        select: { categoryId: true, isIncome: true, amount: true },
      });

      // Group: income bucket keyed by "@@income", others by categoryId
      const map = new Map<string, { total: number; count: number }>();
      for (const e of (expenses as { categoryId?: string | null; isIncome: boolean; amount: number }[])) {
        const key = e.isIncome ? "@@income" : (e.categoryId ?? "@@uncategorized");
        const cur = map.get(key) ?? { total: 0, count: 0 };
        map.set(key, { total: cur.total + e.amount, count: cur.count + 1 });
      }

      // Batch-resolve real category names
      const ids = [...map.keys()].filter((k) => k !== "@@income" && k !== "@@uncategorized");
      const cats = ids.length
        ? await prisma.userCategory.findMany({ where: { id: { in: ids } }, select: { id: true, name: true } })
        : [];
      const nameMap = new Map(cats.map((c) => [c.id, c.name]));

      return Array.from(map.entries()).map(([key, data]) => ({
        category: key === "@@income"
          ? "Income"
          : key === "@@uncategorized"
            ? "Uncategorized"
            : (nameMap.get(key) ?? "Uncategorized"),
        ...data,
      }));
    } catch (err) {
      throw new RepositoryError("Failed to aggregateByCategory", "aggregateByCategory", err);
    }
  }

  async aggregateBySubCategory(
    userId: string,
    from: Date,
    to: Date,
    isIncome: boolean,
  ): Promise<Array<{ subCategory: string; total: number; count: number }>> {
    try {
      const expenses = await prisma.expense.findMany({
        where: { userId, isIncome, date: { gte: from, lte: to } },
        select: { subCategory: true, amount: true },
      });

      const map = new Map<string, { total: number; count: number }>();
      for (const e of (expenses as { subCategory?: string | null; amount: number }[])) {
        const key = e.subCategory ?? "Other";
        const cur = map.get(key) ?? { total: 0, count: 0 };
        map.set(key, { total: cur.total + e.amount, count: cur.count + 1 });
      }

      return Array.from(map.entries()).map(([subCategory, data]) => ({ subCategory, ...data }));
    } catch (err) {
      throw new RepositoryError("Failed to aggregateBySubCategory", "aggregateBySubCategory", err);
    }
  }
}
