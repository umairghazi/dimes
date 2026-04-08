import { Budget } from "../types/prisma.types";
import { prisma } from "../config/db";
import { BaseMongoRepository } from "../base/BaseMongoRepository";

export class BudgetRepository extends BaseMongoRepository<Budget> {
  constructor() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    super(prisma.budget as any);
  }

  async findByUserAndMonth(userId: string, monthYear: string): Promise<Budget[]> {
    return this.findMany({ userId, monthYear });
  }

  async findAllByUser(userId: string): Promise<Budget[]> {
    return this.findMany({ userId });
  }

  async findByUserCategoryMonth(
    userId: string,
    category: string,
    monthYear: string,
  ): Promise<Budget | null> {
    return this.findOne({ userId, category, monthYear });
  }

  async findCarryForwardByMonth(userId: string, monthYear: string): Promise<Budget[]> {
    return this.findMany({ userId, monthYear, carryForward: true });
  }
}
