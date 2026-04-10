import { v4 as uuidv4 } from "uuid";
import Papa from "papaparse";
import { StagingExpense } from "../types/prisma.types";
import { StagingRepository } from "../repositories/staging.repository";
import { ExpenseRepository } from "../repositories/expense.repository";
import { ClassificationRepository } from "../repositories/classification.repository";
import { CategoryRepository } from "../repositories/category.repository";
import { AppError } from "../errors/AppError";
import { isAIAvailable } from "../ai/AIProviderFactory";
import { jobStore } from "./jobStore";
import { cache } from "../lib/cache";

export interface ColumnMapping {
  dateIndex: number;
  debitIndex: number;
  creditIndex: number;
  descriptionIndex: number;
  hasHeader: boolean;
}

export class UploadService {
  constructor(
    private readonly stagingRepo: StagingRepository,
    private readonly expenseRepo: ExpenseRepository,
    private readonly classificationRepo: ClassificationRepository,
    private readonly categoryRepo: CategoryRepository,
  ) {}

  async processCSV(
    userId: string,
    fileBuffer: Buffer,
    columnMapping: ColumnMapping,
  ): Promise<{ batchId: string; jobId: string; count: number }> {
    const csv = fileBuffer.toString("utf-8");
    const { data, errors } = Papa.parse<string[]>(csv, { header: false, skipEmptyLines: true });

    if (errors.length > 0) {
      throw new AppError("CSV parsing failed: " + errors[0].message, 400, "CSV_PARSE_ERROR");
    }

    const rows = columnMapping.hasHeader ? (data as string[][]).slice(1) : (data as string[][]);

    const rawTransactions = rows
      .map((row) => ({
        date: row[columnMapping.dateIndex] ?? "",
        amount: parseFloat((row[columnMapping.debitIndex] ?? "").replace(/[^0-9.]/g, "")),
        description: row[columnMapping.descriptionIndex] ?? "",
      }))
      .filter((t) => t.date && !isNaN(t.amount) && t.amount > 0);

    const batchId = uuidv4();
    const jobId = uuidv4();

    // Save all rows immediately as Miscellaneous — AI will update them in background
    await Promise.all(
      rawTransactions.map((t) =>
        this.stagingRepo.create({
          userId,
          uploadBatchId: batchId,
          date: new Date(t.date),
          description: t.description,
          amount: t.amount,
          aiSuggestedCategory: "Miscellaneous",
          aiConfidence: 0,
          status: "pending",
        }),
      ),
    );

    jobStore.create(jobId, batchId, rawTransactions.length);

    const categories = await this.categoryRepo.findByUserId(userId);
    const userCategories = categories.map((c) => c.name);

    if (userCategories.length === 0 || !isAIAvailable()) {
      // Nothing to classify — mark job done immediately
      jobStore.complete(jobId, false);
    } else {
      // Fire-and-forget background classification
      void this.runClassification(jobId, batchId, userId, rawTransactions, userCategories);
    }

    return { batchId, jobId, count: rawTransactions.length };
  }

  private async runClassification(
    jobId: string,
    batchId: string,
    userId: string,
    rawTransactions: { date: string; amount: number; description: string }[],
    userCategories: string[],
  ): Promise<void> {
    const batchSize = 50;
    let classified = 0;

    try {
      for (let i = 0; i < rawTransactions.length; i += batchSize) {
        const batch = rawTransactions.slice(i, i + batchSize);
        const results = await this.classificationRepo.classify(batch, userCategories);

        // Update each staging row with AI result
        const stagingRows = await this.stagingRepo.findByBatchId(batchId);
        await Promise.all(
          results.map((result) => {
            const row = stagingRows.find(
              (r) => r.description === result.description && r.amount === result.amount,
            );
            if (!row) return Promise.resolve();
            return this.stagingRepo.updateById(row.id, {
              aiSuggestedCategory: result.category,
              aiConfidence: result.confidence,
            });
          }),
        );

        classified += results.length;
        jobStore.update(jobId, classified);
      }

      jobStore.complete(jobId, true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Classification failed";
      jobStore.fail(jobId, msg);
    }
  }

  async getStagingRows(userId: string, batchId: string): Promise<StagingExpense[]> {
    const rows = await this.stagingRepo.findByBatchId(batchId);
    if (rows.length > 0 && rows[0].userId !== userId) {
      throw new AppError("Forbidden", 403, "FORBIDDEN");
    }
    return rows;
  }

  async skipStagingRow(userId: string, batchId: string, rowId: string): Promise<void> {
    const row = await this.stagingRepo.getById(rowId);
    if (!row) throw new AppError("Row not found", 404, "NOT_FOUND");
    if (row.userId !== userId || row.uploadBatchId !== batchId) {
      throw new AppError("Forbidden", 403, "FORBIDDEN");
    }
    await this.stagingRepo.deleteById(rowId);
  }

  async correctCategory(userId: string, batchId: string, rowId: string, category: string): Promise<StagingExpense> {
    const row = await this.stagingRepo.getById(rowId);
    if (!row) throw new AppError("Row not found", 404, "NOT_FOUND");
    if (row.userId !== userId || row.uploadBatchId !== batchId) {
      throw new AppError("Forbidden", 403, "FORBIDDEN");
    }
    return this.stagingRepo.updateById(rowId, { userCorrectedCategory: category }) as Promise<StagingExpense>;
  }

  async confirmBatch(userId: string, batchId: string, currency = "USD"): Promise<{ imported: number }> {
    const rows = await this.getStagingRows(userId, batchId);
    if (rows.length === 0) throw new AppError("Batch not found or empty", 404, "NOT_FOUND");

    // Build name → id map for category resolution
    const userCategories = await this.categoryRepo.findByUserId(userId);
    const nameToId = new Map(userCategories.map((c) => [c.name, c.id]));

    await Promise.all(
      rows.map((row) => {
        const categoryName = row.userCorrectedCategory ?? row.aiSuggestedCategory;
        const categoryId = nameToId.get(categoryName) ?? null;
        return this.expenseRepo.create({
          userId,
          date: row.date,
          description: row.description,
          amount: row.amount,
          currency,
          categoryId,
          source: "csv-upload",
          isRecurring: false,
          tags: [],
          originalDescription: row.description,
        });
      }),
    );

    await this.stagingRepo.deleteByBatchId(batchId);
    cache.delPrefix(`analytics:${userId}:`);
    return { imported: rows.length };
  }

  async discardBatch(userId: string, batchId: string): Promise<void> {
    const rows = await this.getStagingRows(userId, batchId);
    if (rows.length > 0 && rows[0].userId !== userId) {
      throw new AppError("Forbidden", 403, "FORBIDDEN");
    }
    await this.stagingRepo.deleteByBatchId(batchId);
  }
}
