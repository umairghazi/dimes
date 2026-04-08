import { UserCategory } from "../types/prisma.types";
import { CategoryRepository } from "../repositories/category.repository";
import { AppError } from "../errors/AppError";

export class CategoryService {
  constructor(private readonly categoryRepo: CategoryRepository) {}

  async getCategories(userId: string): Promise<UserCategory[]> {
    return this.categoryRepo.findByUserId(userId);
  }

  async createCategory(
    userId: string,
    data: { name: string; group?: string },
  ): Promise<UserCategory> {
    const bareName = data.name.trim();
    if (!bareName) throw new AppError("Category name is required", 400, "VALIDATION_ERROR");

    const group = data.group?.trim() || null;
    const fullName = group ? `${group} - ${bareName}` : bareName;

    const existing = await this.categoryRepo.findMany({ userId, name: fullName });
    if (existing.length > 0) {
      throw new AppError("Category already exists", 409, "DUPLICATE_CATEGORY");
    }

    const siblings = group ? await this.categoryRepo.findMany({ userId, group }) : [];
    const sortOrder = siblings.length;

    return this.categoryRepo.create({ userId, name: fullName, group, sortOrder });
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
    return this.categoryRepo.updateById(id, updates as Record<string, unknown>);
  }

  async deleteCategory(userId: string, id: string): Promise<void> {
    const category = await this.categoryRepo.getById(id);
    if (!category) throw new AppError("Category not found", 404, "NOT_FOUND");
    if (category.userId !== userId) throw new AppError("Forbidden", 403, "FORBIDDEN");
    await this.categoryRepo.deleteById(id);
  }

  async getCategoryNames(userId: string): Promise<string[]> {
    const categories = await this.categoryRepo.findByUserId(userId);
    return categories.map((c) => c.name);
  }
}
