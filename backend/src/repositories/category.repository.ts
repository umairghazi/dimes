import { UserCategory } from "../types/prisma.types";
import { prisma } from "../config/db";
import { BaseMongoRepository } from "../base/BaseMongoRepository";
import { RepositoryError } from "../errors/RepositoryError";

export class CategoryRepository extends BaseMongoRepository<UserCategory> {
  constructor() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    super(prisma.userCategory as any);
  }

  async findByUserId(userId: string): Promise<UserCategory[]> {
    try {
      return (await prisma.userCategory.findMany({
        where: { userId, OR: [{ deletedAt: null }, { deletedAt: { isSet: false } }] },
        orderBy: [{ group: "asc" }, { sortOrder: "asc" }, { name: "asc" }],
      })) as UserCategory[];
    } catch (err) {
      throw new RepositoryError("Failed to findByUserId", "findByUserId", err);
    }
  }

  async findAllByUserId(userId: string): Promise<UserCategory[]> {
    try {
      return (await prisma.userCategory.findMany({
        where: { userId },
        orderBy: [{ group: "asc" }, { sortOrder: "asc" }, { name: "asc" }],
      })) as UserCategory[];
    } catch (err) {
      throw new RepositoryError("Failed to findAllByUserId", "findAllByUserId", err);
    }
  }

  async countByUserId(userId: string): Promise<number> {
    return this.count({ userId });
  }

  async deleteByUserId(userId: string): Promise<void> {
    try {
      await prisma.userCategory.deleteMany({ where: { userId } });
    } catch (err) {
      throw new RepositoryError("Failed to deleteByUserId", "deleteByUserId", err);
    }
  }
}
