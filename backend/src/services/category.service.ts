import { CategoryRepository, CreateCategoryData, UpdateCategoryData } from "../repositories/category.repository";
import { AppError } from "../errors/AppError";
import { FinanceCategory, FinanceCategoryType } from "../types/finance.types";

export class CategoryService {
  constructor(
    private readonly categoryRepo = new CategoryRepository(),
  ) {}

  list(userId: string, type?: FinanceCategoryType): Promise<FinanceCategory[]> {
    return this.categoryRepo.listByUser(userId, type);
  }

  async create(userId: string, data: CreateCategoryData): Promise<FinanceCategory> {
    await this.validateParent(userId, data.parentId, data.type ?? "expense");
    return this.categoryRepo.create(userId, data);
  }

  async update(userId: string, id: string, patch: UpdateCategoryData): Promise<FinanceCategory> {
    const current = await this.categoryRepo.findById(userId, id);
    if (!current) throw new AppError("Category not found", 404, "CATEGORY_NOT_FOUND");

    const nextType = patch.type ?? current.type;
    await this.validateParent(userId, patch.parentId, nextType, id);
    return this.categoryRepo.update(userId, id, patch);
  }

  delete(userId: string, id: string): Promise<void> {
    return this.categoryRepo.delete(userId, id);
  }

  private async validateParent(
    userId: string,
    parentId: string | null | undefined,
    type: FinanceCategoryType,
    categoryId?: string,
  ): Promise<void> {
    if (!parentId) return;
    if (parentId === categoryId) throw new AppError("Category cannot be its own parent", 400, "INVALID_CATEGORY_PARENT");

    const categories = await this.categoryRepo.listByUser(userId);
    const parent = categories.find((category) => category.id === parentId);
    if (!parent) throw new AppError("Parent category not found", 404, "CATEGORY_PARENT_NOT_FOUND");
    if (parent.type !== type) throw new AppError("Parent category must use the same type", 400, "CATEGORY_PARENT_TYPE_MISMATCH");

    if (!categoryId) return;
    let cursor = parent;
    const seen = new Set<string>();
    while (cursor.parentId && !seen.has(cursor.id)) {
      if (cursor.parentId === categoryId) {
        throw new AppError("Category cannot be moved under its descendant", 400, "CATEGORY_PARENT_CYCLE");
      }
      seen.add(cursor.id);
      const next = categories.find((category) => category.id === cursor.parentId);
      if (!next) break;
      cursor = next;
    }
  }
}
