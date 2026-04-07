import { v4 as uuidv4 } from "uuid";
import Papa from "papaparse";
import { StagingExpense } from "../types/prisma.types";
import { StagingRepository } from "../repositories/staging.repository";
import { ExpenseRepository } from "../repositories/expense.repository";
import { ClassificationRepository } from "../repositories/classification.repository";
import { AppError } from "../errors/AppError";
import { isAIAvailable } from "../ai/AIProviderFactory";

export interface ColumnMapping {
  dateIndex: number;
  debitIndex: number;
  creditIndex: number; // -1 if not mapped
  descriptionIndex: number;
  hasHeader: boolean;
}

export class UploadService {
  constructor(
    private readonly stagingRepo: StagingRepository,
    private readonly expenseRepo: ExpenseRepository,
    private readonly classificationRepo: ClassificationRepository,
  ) {}

  async processCSV(
    userId: string,
    fileBuffer: Buffer,
    columnMapping: ColumnMapping,
  ): Promise<{ batchId: string; count: number; aiAvailable: boolean }> {
    const csv = fileBuffer.toString("utf-8");
    const { data, errors } = Papa.parse<string[]>(csv, { header: false, skipEmptyLines: true });

    if (errors.length > 0) {
      throw new AppError("CSV parsing failed: " + errors[0].message, 400, "CSV_PARSE_ERROR");
    }

    const rows = columnMapping.hasHeader ? (data as string[][]).slice(1) : (data as string[][]);

    const rawTransactions = rows
      .map((row) => {
        const debitRaw = (row[columnMapping.debitIndex] ?? "").replace(/[^0-9.]/g, "");
        const amount = parseFloat(debitRaw);
        return {
          date: row[columnMapping.dateIndex] ?? "",
          amount,
          description: row[columnMapping.descriptionIndex] ?? "",
        };
      })
      // Skip rows where debit is empty/zero — these are income/credit rows
      .filter((t) => t.date && !isNaN(t.amount) && t.amount > 0);

    const classified = await this.classificationRepo.classify(rawTransactions);
    const uploadBatchId = uuidv4();

    await Promise.all(
      classified.map((t) =>
        this.stagingRepo.create({
          userId,
          uploadBatchId,
          date: new Date(t.date),
          description: t.description,
          amount: t.amount,
          aiSuggestedCategory: t.category,
          aiConfidence: t.confidence,
          status: "pending",
        }),
      ),
    );

    return { batchId: uploadBatchId, count: classified.length, aiAvailable: isAIAvailable() };
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

  async confirmBatch(userId: string, batchId: string): Promise<{ imported: number }> {
    const rows = await this.getStagingRows(userId, batchId);
    if (rows.length === 0) throw new AppError("Batch not found or empty", 404, "NOT_FOUND");

    await Promise.all(
      rows.map((row) =>
        this.expenseRepo.create({
          userId,
          date: row.date,
          description: row.description,
          amount: row.amount,
          currency: "USD",
          category: row.userCorrectedCategory ?? row.aiSuggestedCategory,
          source: "csv-upload",
          isRecurring: false,
          tags: [],
          originalDescription: row.description,
        }),
      ),
    );

    await this.stagingRepo.deleteByBatchId(batchId);
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
