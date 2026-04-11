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

type StoredExpense = Omit<Expense, "category"> & { categoryId?: string | null; type: string };

export class ExpenseRepository extends BaseMongoRepository<Expense> {
  constructor() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    super(prisma.expense as any);
  }

  /** Batch-resolve categoryId → name for a list of stored expenses. */
  private async resolveNames(expenses: StoredExpense[]): Promise<(StoredExpense & { category: string })[]> {
    const ids = [...new Set(expenses.filter((e) => e.categoryId).map((e) => e.categoryId as string))];
    const cats = ids.length
      ? await prisma.userCategory.findMany({ where: { id: { in: ids } }, select: { id: true, name: true } })
      : [];
    const nameMap = new Map(cats.map((c) => [c.id, c.name]));
    return expenses.map((e) => ({
      ...e,
      category: e.categoryId ? (nameMap.get(e.categoryId) ?? "Uncategorized") : "Uncategorized",
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

  /** Normalize a description for history matching: lowercase, strip punctuation + standalone numbers */
  static normalizeDescription(desc: string): string {
    return desc
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, "")
      .replace(/\b\d+\b/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  /**
   * Returns a map of normalized description → { categoryId, count } using the user's
   * confirmed expense history. The most frequent categoryId wins per description.
   * Income expenses are excluded.
   */
  async getClassificationHistory(
    userId: string,
  ): Promise<Map<string, { categoryId: string | null; count: number }>> {
    try {
      const expenses = await prisma.expense.findMany({
        where: { userId, type: "expense" },
        select: { description: true, categoryId: true },
      });

      // (normalizedDesc) → (categoryId → count)
      const counts = new Map<string, Map<string | null, number>>();
      for (const e of (expenses as { description: string; categoryId?: string | null }[])) {
        const key = ExpenseRepository.normalizeDescription(e.description);
        if (!key) continue;
        const catCounts = counts.get(key) ?? new Map<string | null, number>();
        const catKey = e.categoryId ?? null;
        catCounts.set(catKey, (catCounts.get(catKey) ?? 0) + 1);
        counts.set(key, catCounts);
      }

      // Pick the most-frequent categoryId per description
      const result = new Map<string, { categoryId: string | null; count: number }>();
      for (const [desc, catCounts] of counts) {
        let bestCatId: string | null = null;
        let bestCount = 0;
        let totalCount = 0;
        for (const [catId, cnt] of catCounts) {
          totalCount += cnt;
          if (cnt > bestCount) {
            bestCount = cnt;
            bestCatId = catId;
          }
        }
        result.set(desc, { categoryId: bestCatId, count: totalCount });
      }
      return result;
    } catch (err) {
      throw new RepositoryError("Failed to getClassificationHistory", "getClassificationHistory", err);
    }
  }

  async aggregateByCategory(
    userId: string,
    from: Date,
    to: Date,
  ): Promise<Array<{ category: string; type: string; total: number; count: number }>> {
    try {
      const expenses = await prisma.expense.findMany({
        where: { userId, date: { gte: from, lte: to } },
        select: { categoryId: true, type: true, amount: true },
      });

      // Group by (type, categoryId)
      const map = new Map<string, { type: string; total: number; count: number }>();
      for (const e of (expenses as { categoryId?: string | null; type: string; amount: number }[])) {
        const key = `${e.type}:${e.categoryId ?? "@@uncategorized"}`;
        const cur = map.get(key) ?? { type: e.type, total: 0, count: 0 };
        map.set(key, { type: e.type, total: cur.total + e.amount, count: cur.count + 1 });
      }

      // Batch-resolve category names
      const ids = [...new Set(
        [...map.keys()]
          .map((k) => k.split(":")[1])
          .filter((id) => id !== "@@uncategorized"),
      )];
      const cats = ids.length
        ? await prisma.userCategory.findMany({ where: { id: { in: ids } }, select: { id: true, name: true } })
        : [];
      const nameMap = new Map(cats.map((c) => [c.id, c.name]));

      return Array.from(map.entries()).map(([key, data]) => {
        const categoryId = key.split(":")[1];
        return {
          category: categoryId === "@@uncategorized" ? "Uncategorized" : (nameMap.get(categoryId) ?? "Uncategorized"),
          ...data,
        };
      });
    } catch (err) {
      throw new RepositoryError("Failed to aggregateByCategory", "aggregateByCategory", err);
    }
  }
}
