import { v4 as uuidv4 } from "uuid";
import Papa from "papaparse";
import { StagingExpense } from "../types/prisma.types";
import { StagingRepository } from "../repositories/staging.repository";
import { ExpenseRepository } from "../repositories/expense.repository";
import { ClassificationRepository } from "../repositories/classification.repository";
import { CategoryRepository } from "../repositories/category.repository";
import { AppError } from "../errors/AppError";
import { jobStore } from "./jobStore";
import { cache } from "../lib/cache";
import { getAIProvider, isAIAvailable } from "../ai/AIProviderFactory";

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

    return this.stageAndClassify(userId, rawTransactions);
  }

  async processParsedRows(
    userId: string,
    rows: { date: string; amount: number; description: string }[],
  ): Promise<{ batchId: string; jobId: string; count: number }> {
    const valid = rows.filter((t) => t.date && !isNaN(t.amount) && t.amount > 0);
    if (valid.length === 0) {
      throw new AppError("No valid transactions to import", 400, "NO_TRANSACTIONS");
    }
    return this.stageAndClassify(userId, valid);
  }

  async parsePasteWithAI(
    userId: string,
    rawText: string,
  ): Promise<{ batchId: string; jobId: string; count: number }> {
    if (!isAIAvailable()) {
      throw new AppError("AI provider is not configured", 503, "AI_UNAVAILABLE");
    }
    const provider = getAIProvider();
    const parsed = await provider.parseTransactions(rawText);
    const valid = parsed.filter((t) => t.date && !isNaN(t.amount) && t.amount > 0);
    if (valid.length === 0) {
      throw new AppError("No expense transactions found in the pasted text", 400, "NO_TRANSACTIONS");
    }
    return this.stageAndClassify(userId, valid);
  }

  private async stageAndClassify(
    userId: string,
    rawTransactions: { date: string; amount: number; description: string }[],
  ): Promise<{ batchId: string; jobId: string; count: number }> {
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
    const idToName = new Map(categories.map((c) => [c.id, c.name]));

    if (userCategories.length === 0) {
      // Nothing to classify — mark job done immediately
      jobStore.complete(jobId, false);
    } else {
      // Fire-and-forget background classification (history lookup + AI fallback)
      void this.runClassification(jobId, batchId, userId, rawTransactions, userCategories, idToName);
    }

    return { batchId, jobId, count: rawTransactions.length };
  }

  private async runClassification(
    jobId: string,
    batchId: string,
    userId: string,
    rawTransactions: { date: string; amount: number; description: string }[],
    userCategories: string[],
    idToName: Map<string, string>,
  ): Promise<void> {
    try {
      // Build history context from user's confirmed expenses
      const historyEntries = await this.expenseRepo.getClassificationHistory(userId);
      const history = { entries: historyEntries, idToName };

      // Classify all transactions in one shot (history pre-filters, AI handles the rest)
      const results = await this.classificationRepo.classify(rawTransactions, userCategories, history);

      // Update each staging row with results
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
            classificationSource: result.classificationSource ?? "ai",
          });
        }),
      );

      jobStore.update(jobId, results.length);
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

  async patchStagingRow(
    userId: string,
    batchId: string,
    rowId: string,
    patch: { category?: string; description?: string },
  ): Promise<StagingExpense> {
    const row = await this.stagingRepo.getById(rowId);
    if (!row) throw new AppError("Row not found", 404, "NOT_FOUND");
    if (row.userId !== userId || row.uploadBatchId !== batchId) {
      throw new AppError("Forbidden", 403, "FORBIDDEN");
    }
    const data: Record<string, unknown> = {};
    if (patch.category) data.userCorrectedCategory = patch.category;
    if (patch.description) data.description = patch.description;
    return this.stagingRepo.updateById(rowId, data) as Promise<StagingExpense>;
  }

  async splitStagingRow(
    userId: string,
    batchId: string,
    rowId: string,
    splits: { description: string; amount: number; category: string }[],
  ): Promise<StagingExpense[]> {
    const row = await this.stagingRepo.getById(rowId);
    if (!row) throw new AppError("Row not found", 404, "NOT_FOUND");
    if (row.userId !== userId || row.uploadBatchId !== batchId) {
      throw new AppError("Forbidden", 403, "FORBIDDEN");
    }

    const totalSplit = splits.reduce((sum, s) => sum + s.amount, 0);
    if (Math.abs(totalSplit - row.amount) > 0.01) {
      throw new AppError(
        `Split amounts ($${totalSplit.toFixed(2)}) must equal original amount ($${row.amount.toFixed(2)})`,
        400,
        "SPLIT_AMOUNT_MISMATCH",
      );
    }

    await this.stagingRepo.deleteById(rowId);

    return Promise.all(
      splits.map((split) =>
        this.stagingRepo.create({
          userId,
          uploadBatchId: batchId,
          date: row.date,
          description: split.description,
          amount: split.amount,
          aiSuggestedCategory: split.category,
          aiConfidence: 1,
          userCorrectedCategory: split.category,
          classificationSource: "ai",
          status: "pending",
        }),
      ),
    );
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
