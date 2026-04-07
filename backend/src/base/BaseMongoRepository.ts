import { RepositoryError } from "../errors/RepositoryError";

// Represents the shape of a Prisma model delegate (e.g. prisma.expense)
interface PrismaDelegate {
  findUnique: (args: { where: Record<string, unknown> }) => Promise<unknown>;
  findFirst: (args: { where: Record<string, unknown> }) => Promise<unknown>;
  findMany: (args?: { where?: Record<string, unknown>; skip?: number; take?: number; orderBy?: unknown }) => Promise<unknown[]>;
  create: (args: { data: Record<string, unknown> }) => Promise<unknown>;
  update: (args: { where: Record<string, unknown>; data: Record<string, unknown> }) => Promise<unknown>;
  delete: (args: { where: Record<string, unknown> }) => Promise<unknown>;
  count: (args?: { where?: Record<string, unknown> }) => Promise<number>;
}

export abstract class BaseMongoRepository<T> {
  constructor(protected readonly delegate: PrismaDelegate) {}

  async getById(id: string): Promise<T | null> {
    try {
      return (await this.delegate.findUnique({ where: { id } })) as T | null;
    } catch (err) {
      throw new RepositoryError(`Failed to get by id: ${id}`, "getById", err);
    }
  }

  async getAll(filters: Record<string, unknown> = {}, skip?: number, take?: number): Promise<T[]> {
    try {
      return (await this.delegate.findMany({ where: filters, skip, take })) as T[];
    } catch (err) {
      throw new RepositoryError("Failed to getAll", "getAll", err);
    }
  }

  async create(data: Record<string, unknown>): Promise<T> {
    try {
      return (await this.delegate.create({ data })) as T;
    } catch (err) {
      throw new RepositoryError("Failed to create", "create", err);
    }
  }

  async updateById(id: string, data: Record<string, unknown>): Promise<T> {
    try {
      return (await this.delegate.update({ where: { id }, data })) as T;
    } catch (err) {
      throw new RepositoryError(`Failed to update id: ${id}`, "updateById", err);
    }
  }

  async deleteById(id: string): Promise<T> {
    try {
      return (await this.delegate.delete({ where: { id } })) as T;
    } catch (err) {
      throw new RepositoryError(`Failed to delete id: ${id}`, "deleteById", err);
    }
  }

  async findOne(where: Record<string, unknown>): Promise<T | null> {
    try {
      return (await this.delegate.findFirst({ where })) as T | null;
    } catch (err) {
      throw new RepositoryError("Failed to findOne", "findOne", err);
    }
  }

  async findMany(where: Record<string, unknown>): Promise<T[]> {
    try {
      return (await this.delegate.findMany({ where })) as T[];
    } catch (err) {
      throw new RepositoryError("Failed to findMany", "findMany", err);
    }
  }

  async exists(where: Record<string, unknown>): Promise<boolean> {
    try {
      const count = await this.delegate.count({ where });
      return count > 0;
    } catch (err) {
      throw new RepositoryError("Failed to check exists", "exists", err);
    }
  }

  async count(where: Record<string, unknown> = {}): Promise<number> {
    try {
      return await this.delegate.count({ where });
    } catch (err) {
      throw new RepositoryError("Failed to count", "count", err);
    }
  }
}
