import { UserCategory } from "../types/prisma.types";
import { CategoryRepository } from "../repositories/category.repository";
import { DEFAULT_CATEGORIES } from "../types/defaultCategories";
import { AppError } from "../errors/AppError";

export class CategoryService {
  constructor(private readonly categoryRepo: CategoryRepository) {}

  async getCategories(userId: string): Promise<UserCategory[]> {
    const count = await this.categoryRepo.countByUserId(userId);
    if (count === 0) {
      await this.seedDefaults(userId);
    }
    return this.categoryRepo.findByUserId(userId);
  }

  async createCategory(
    userId: string,
    data: { name: string; group?: string },
  ): Promise<UserCategory> {
    const name = data.name.trim();
    if (!name) throw new AppError("Category name is required", 400, "VALIDATION_ERROR");

    // Check for duplicate within the user's categories
    const existing = await this.categoryRepo.findMany({ userId, name });
    if (existing.length > 0) {
      throw new AppError("Category already exists", 409, "DUPLICATE_CATEGORY");
    }

    const group = data.group?.trim() || null;
    const siblings = group
      ? await this.categoryRepo.findMany({ userId, group })
      : [];
    const sortOrder = siblings.length;

    return this.categoryRepo.create({ userId, name, group, sortOrder });
  }

  async updateCategory(
    userId: string,
    id: string,
    data: { name?: string; group?: string | null },
  ): Promise<UserCategory> {
    const category = await this.categoryRepo.getById(id);
    if (!category) throw new AppError("Category not found", 404, "NOT_FOUND");
    if (category.userId !== userId) throw new AppError("Forbidden", 403, "FORBIDDEN");

    const updates: Partial<UserCategory> = {};
    if (data.name !== undefined) updates.name = data.name.trim();
    if (data.group !== undefined) updates.group = data.group?.trim() || null;

    return this.categoryRepo.updateById(id, updates as Record<string, unknown>);
  }

  async deleteCategory(userId: string, id: string): Promise<void> {
    const category = await this.categoryRepo.getById(id);
    if (!category) throw new AppError("Category not found", 404, "NOT_FOUND");
    if (category.userId !== userId) throw new AppError("Forbidden", 403, "FORBIDDEN");
    await this.categoryRepo.deleteById(id);
  }

  async getCategoryNames(userId: string): Promise<string[]> {
    const categories = await this.getCategories(userId);
    return categories.map((c) => c.name);
  }

  private async seedDefaults(userId: string): Promise<void> {
    await Promise.all(
      DEFAULT_CATEGORIES.map((cat) =>
        this.categoryRepo.create({
          userId,
          name: cat.name,
          group: cat.group,
          sortOrder: cat.sortOrder,
        }),
      ),
    );
  }
}
