import {
  CreateTransactionData,
  TransactionFilters,
  TransactionRepository,
  UpdateTransactionData,
} from "../repositories/transaction.repository";
import { CategoryRepository } from "../repositories/category.repository";
import { AppError } from "../errors/AppError";
import { FinanceTransaction, FinanceTransactionType, monthFromDate } from "../types/finance.types";

export interface ImportTransactionRow {
  date: string;
  monthYear?: string;
  description: string;
  amount: number;
  type: FinanceTransactionType;
  categoryName?: string | null;
  parentName?: string | null;
  currency?: string;
}

export interface ImportTransactionsResult {
  transactions: FinanceTransaction[];
  createdParents: number;
  createdCategories: number;
  skippedDuplicates: number;
  processedRows: number;
}

export class TransactionService {
  constructor(
    private readonly transactionRepo = new TransactionRepository(),
    private readonly categoryRepo = new CategoryRepository(),
  ) {}

  list(userId: string, filters: TransactionFilters): Promise<FinanceTransaction[]> {
    return this.transactionRepo.listByUser(userId, filters);
  }

  async create(userId: string, data: CreateTransactionData): Promise<FinanceTransaction> {
    await this.validateCategory(userId, data.categoryId);
    return this.transactionRepo.create(userId, data);
  }

  async update(userId: string, id: string, patch: UpdateTransactionData): Promise<FinanceTransaction> {
    await this.validateCategory(userId, patch.categoryId);
    return this.transactionRepo.update(userId, id, patch);
  }

  delete(userId: string, id: string): Promise<void> {
    return this.transactionRepo.delete(userId, id);
  }

  async importRows(userId: string, rows: ImportTransactionRow[]): Promise<ImportTransactionsResult> {
    const categoryCache = new Map<string, string>();
    let createdParents = 0;
    let createdCategories = 0;
    let skippedDuplicates = 0;

    const months = [...new Set(rows.map((row) => row.monthYear ?? monthFromDate(row.date)))];
    const existingTransactions = await this.transactionRepo.listByMonths(userId, months);
    const seenTransactions = new Set(existingTransactions.map((transaction) => this.transactionKey({
      date: transaction.date,
      monthYear: transaction.monthYear,
      description: transaction.description,
      amount: transaction.amount,
      type: transaction.type,
    })));

    const existingCategories = await this.categoryRepo.listByUser(userId);
    existingCategories.forEach((category) => {
      categoryCache.set(this.key(category.type, category.parentId ?? "none", category.name), category.id);
    });

    const imported: FinanceTransaction[] = [];
    for (const row of rows) {
      const type = row.type;
      const monthYear = row.monthYear ?? monthFromDate(row.date);
      const transactionKey = this.transactionKey({
        date: row.date,
        monthYear,
        description: row.description,
        amount: row.amount,
        type,
      });
      if (seenTransactions.has(transactionKey)) {
        skippedDuplicates += 1;
        continue;
      }

      const names = this.normalizeNames(row.categoryName, row.parentName);
      let parentId: string | null = null;
      let categoryId: string | null = null;

      if (names.parentName) {
        const parentKey = this.key(type, "none", names.parentName);
        parentId = categoryCache.get(parentKey) ?? null;
        if (!parentId) {
          const parent = await this.categoryRepo.create(userId, { name: names.parentName, parentId: null, type });
          parentId = parent.id;
          categoryCache.set(parentKey, parent.id);
          createdParents += 1;
        }
      }

      if (names.categoryName) {
        const categoryKey = this.key(type, parentId ?? "none", names.categoryName);
        categoryId = categoryCache.get(categoryKey) ?? null;
        if (!categoryId) {
          const category = await this.categoryRepo.create(userId, {
            name: names.categoryName,
            parentId,
            type,
          });
          categoryId = category.id;
          categoryCache.set(categoryKey, category.id);
          createdCategories += 1;
        }
      }

      imported.push(await this.transactionRepo.create(userId, {
        date: row.date,
        monthYear,
        description: row.description,
        amount: row.amount,
        currency: row.currency ?? "CAD",
        categoryId,
        type,
        source: "import",
        tags: ["sheets-import"],
      }));
      seenTransactions.add(transactionKey);
    }

    return {
      transactions: imported,
      createdParents,
      createdCategories,
      skippedDuplicates,
      processedRows: rows.length,
    };
  }

  private async validateCategory(userId: string, categoryId: string | null | undefined): Promise<void> {
    if (!categoryId) return;
    const exists = await this.categoryRepo.existsForUser(userId, categoryId);
    if (!exists) throw new AppError("Category not found", 404, "CATEGORY_NOT_FOUND");
  }

  private normalizeNames(categoryName?: string | null, parentName?: string | null): { categoryName: string | null; parentName: string | null } {
    const cleanCategory = categoryName?.trim() || null;
    const cleanParent = parentName?.trim() || null;
    if (!cleanCategory) return { categoryName: null, parentName: cleanParent };

    if (cleanParent) {
      return {
        categoryName: this.stripParentPrefix(cleanCategory, cleanParent),
        parentName: cleanParent,
      };
    }

    const slashParts = cleanCategory.split("/").map((part) => part.trim()).filter(Boolean);
    if (slashParts.length >= 2) {
      return {
        parentName: slashParts[0],
        categoryName: slashParts.slice(1).join(" / "),
      };
    }

    const dashParts = cleanCategory.split(" - ").map((part) => part.trim()).filter(Boolean);
    if (dashParts.length >= 2) {
      return {
        parentName: dashParts[0],
        categoryName: dashParts.slice(1).join(" - "),
      };
    }

    return { categoryName: cleanCategory, parentName: null };
  }

  private stripParentPrefix(categoryName: string, parentName: string): string {
    const escapedParent = parentName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const next = categoryName.replace(new RegExp(`^${escapedParent}\\s*(?:/|-|:)?\\s+`, "i"), "").trim();
    return next || categoryName;
  }

  private key(...parts: Array<string | null | undefined>): string {
    return parts.map((part) => (part ?? "").trim().toLowerCase().replace(/\s+/g, " ")).join("::");
  }

  private transactionKey(row: {
    date: string;
    monthYear: string;
    description: string;
    amount: number;
    type: FinanceTransactionType;
  }): string {
    return this.key(
      row.date.slice(0, 10),
      row.monthYear,
      row.description,
      row.amount.toFixed(2),
      row.type,
    );
  }
}
