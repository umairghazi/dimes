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
    await this.validateCategory(userId, data.categoryId, data.type ?? "expense");
    return this.transactionRepo.create(userId, data);
  }

  async update(userId: string, id: string, patch: UpdateTransactionData): Promise<FinanceTransaction> {
    const existing = await this.transactionRepo.findById(userId, id);
    if (!existing) throw new AppError("Transaction not found", 404, "TRANSACTION_NOT_FOUND");
    await this.validateCategory(userId, patch.categoryId !== undefined ? patch.categoryId : existing.categoryId, patch.type ?? existing.type);
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
      const categoryType = type === "expense_refund" ? "expense" : type;
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

      const categoryPath = this.normalizeCategoryPath(row.categoryName);
      let parentId: string | null = null;
      let categoryId: string | null = null;

      for (const [index, categoryName] of categoryPath.entries()) {
        const categoryKey = this.key(categoryType, parentId ?? "none", categoryName);
        let nextCategoryId = categoryCache.get(categoryKey) ?? null;
        if (!nextCategoryId) {
          const category = await this.categoryRepo.create(userId, {
            name: categoryName,
            parentId,
            type: categoryType,
          });
          nextCategoryId = category.id;
          categoryCache.set(categoryKey, category.id);
          if (index === 0) createdParents += 1;
          else createdCategories += 1;
        }

        parentId = nextCategoryId;
        categoryId = nextCategoryId;
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

  private async validateCategory(userId: string, categoryId: string | null | undefined, type: FinanceTransactionType): Promise<void> {
    if (!categoryId) return;
    const category = await this.categoryRepo.findById(userId, categoryId);
    if (!category) throw new AppError("Category not found", 404, "CATEGORY_NOT_FOUND");
    if (category.type !== (type === "expense_refund" ? "expense" : type)) {
      throw new AppError("Transaction and category types do not match", 400, "CATEGORY_TYPE_MISMATCH");
    }
  }

  private normalizeCategoryPath(categoryName?: string | null): string[] {
    return this.compactPath(this.hierarchyParts(categoryName));
  }

  private hierarchyParts(value?: string | null): string[] {
    return (value ?? "")
      .split(/\s+-\s+/)
      .map((part) => part.trim())
      .filter(Boolean);
  }

  private compactPath(parts: string[]): string[] {
    return parts.reduce<string[]>((path, part) => {
      const previous = path[path.length - 1];
      if (!previous || !this.sameName(previous, part)) path.push(part);
      return path;
    }, []);
  }

  private sameName(first: string, second: string): boolean {
    return this.key(first) === this.key(second);
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
