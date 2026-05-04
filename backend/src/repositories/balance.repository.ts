import { MonthlyBalance } from "../types/prisma.types";
import { prisma } from "../config/db";
import { BaseMongoRepository } from "../base/BaseMongoRepository";
import { RepositoryError } from "../errors/RepositoryError";

export class BalanceRepository extends BaseMongoRepository<MonthlyBalance> {
  constructor() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    super((prisma as any).monthlyBalance);
  }

  async findByUserAndMonth(userId: string, monthYear: string): Promise<MonthlyBalance | null> {
    return this.findOne({ userId, monthYear });
  }

  async findAllByUser(userId: string): Promise<MonthlyBalance[]> {
    return this.findMany({ userId });
  }

  async upsert(
    userId: string,
    monthYear: string,
    data: { startingBalance: number; endingBalance?: number | null; currency?: string },
  ): Promise<MonthlyBalance> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (await (prisma as any).monthlyBalance.upsert({
        where: { userId_monthYear: { userId, monthYear } },
        create: { userId, monthYear, ...data },
        update: data,
      })) as MonthlyBalance;
    } catch (err) {
      throw new RepositoryError("Failed to upsert monthly balance", "upsert", err);
    }
  }
}
