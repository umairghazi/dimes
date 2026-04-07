import { StagingExpense } from "../types/prisma.types";
import { prisma } from "../config/db";
import { BaseMongoRepository } from "../base/BaseMongoRepository";
import { RepositoryError } from "../errors/RepositoryError";

export class StagingRepository extends BaseMongoRepository<StagingExpense> {
  constructor() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    super(prisma.stagingExpense as any);
  }

  async findByBatchId(uploadBatchId: string): Promise<StagingExpense[]> {
    return this.findMany({ uploadBatchId });
  }

  async deleteByBatchId(uploadBatchId: string): Promise<void> {
    try {
      await prisma.stagingExpense.deleteMany({ where: { uploadBatchId } });
    } catch (err) {
      throw new RepositoryError("Failed to deleteByBatchId", "deleteByBatchId", err);
    }
  }

  async confirmBatch(uploadBatchId: string): Promise<StagingExpense[]> {
    try {
      const rows = await prisma.stagingExpense.findMany({ where: { uploadBatchId, status: "pending" } });
      await prisma.stagingExpense.updateMany({
        where: { uploadBatchId },
        data: { status: "confirmed" },
      });
      return rows;
    } catch (err) {
      throw new RepositoryError("Failed to confirmBatch", "confirmBatch", err);
    }
  }
}
