import { UserCategory } from "../types/prisma.types";
import { CategoryRepository } from "../repositories/category.repository";
import { ExpenseRepository } from "../repositories/expense.repository";
import { AppError } from "../errors/AppError";
import { cache, TTL } from "../lib/cache";

export class CategoryService {
  constructor(
    private readonly categoryRepo: CategoryRepository,
    private readonly expenseRepo: ExpenseRepository,
  ) {}

  async getCategories(userId: string): Promise<UserCategory[]> {
    const cacheKey = `categories:${userId}`;
    const cached = cache.get<UserCategory[]>(cacheKey);
    if (cached) return cached;

    const result = await this.categoryRepo.findByUserId(userId);
    cache.set(cacheKey, result, TTL.CATEGORIES);
    return result;
  }

  async createCategory(
    userId: string,
    data: { name: string; group?: string },
  ): Promise<UserCategory> {
    const bareName = data.name.trim();
    if (!bareName) throw new AppError("Category name is required", 400, "VALIDATION_ERROR");

    const group = data.group?.trim() || null;
    const fullName = group ? `${group} - ${bareName}` : bareName;

    const existing = (await this.categoryRepo.findMany({ userId, name: fullName }))
      .filter((c) => !c.deletedAt);
    if (existing.length > 0) {
      throw new AppError("Category already exists", 409, "DUPLICATE_CATEGORY");
    }

    const siblings = group
      ? (await this.categoryRepo.findMany({ userId, group })).filter((c) => !c.deletedAt)
      : [];
    const sortOrder = siblings.length;

    const result = await this.categoryRepo.create({ userId, name: fullName, group, sortOrder });
    cache.del(`categories:${userId}`);
    return result;
  }

  async updateCategory(
    userId: string,
    id: string,
    data: { name?: string; group?: string | null },
  ): Promise<UserCategory> {
    const category = await this.categoryRepo.getById(id);
    if (!category) throw new AppError("Category not found", 404, "NOT_FOUND");
    if (category.userId !== userId) throw new AppError("Forbidden", 403, "FORBIDDEN");

    const newGroup = data.group !== undefined ? (data.group?.trim() || null) : category.group;
    const newBareName = data.name !== undefined
      ? data.name.trim()
      : (category.group ? category.name.replace(`${category.group} - `, "") : category.name);
    const newFullName = newGroup ? `${newGroup} - ${newBareName}` : newBareName;

    const updates: Partial<UserCategory> = { name: newFullName, group: newGroup };
    const result = await this.categoryRepo.updateById(id, updates as Record<string, unknown>);

    // Cascade name change to all expenses referencing this category by ID
    if (newFullName !== category.name) {
      await this.expenseRepo.updateByCategoryId(id, { category: newFullName });
    }

    cache.del(`categories:${userId}`);
    return result;
  }

  async getAllCategories(userId: string): Promise<UserCategory[]> {
    return this.categoryRepo.findAllByUserId(userId);
  }

  async deleteCategory(userId: string, id: string): Promise<void> {
    const category = await this.categoryRepo.getById(id);
    if (!category) throw new AppError("Category not found", 404, "NOT_FOUND");
    if (category.userId !== userId) throw new AppError("Forbidden", 403, "FORBIDDEN");
    await this.categoryRepo.updateById(id, { deletedAt: new Date() } as Record<string, unknown>);
    cache.del(`categories:${userId}`);
  }

  async restoreCategory(userId: string, id: string): Promise<UserCategory> {
    const category = await this.categoryRepo.getById(id);
    if (!category) throw new AppError("Category not found", 404, "NOT_FOUND");
    if (category.userId !== userId) throw new AppError("Forbidden", 403, "FORBIDDEN");
    const result = await this.categoryRepo.updateById(id, { deletedAt: null } as Record<string, unknown>);
    cache.del(`categories:${userId}`);
    return result;
  }

  async getCategoryNames(userId: string): Promise<string[]> {
    const categories = await this.getCategories(userId);
    return categories.map((c) => c.name);
  }
}
