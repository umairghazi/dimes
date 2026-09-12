import { CategoryRepository, CreateCategoryData, UpdateCategoryData } from "../repositories/category.repository";
import { CategoryGroupRepository } from "../repositories/categoryGroup.repository";
import { AppError } from "../errors/AppError";
import { FinanceCategory, FinanceTransactionType } from "../types/finance.types";

export class CategoryService {
  constructor(
    private readonly categoryRepo = new CategoryRepository(),
    private readonly categoryGroupRepo = new CategoryGroupRepository(),
  ) {}

  list(userId: string, type?: FinanceTransactionType): Promise<FinanceCategory[]> {
    return this.categoryRepo.listByUser(userId, type);
  }

  async create(userId: string, data: CreateCategoryData): Promise<FinanceCategory> {
    await this.validateGroup(userId, data.groupId);
    return this.categoryRepo.create(userId, data);
  }

  async update(userId: string, id: string, patch: UpdateCategoryData): Promise<FinanceCategory> {
    await this.validateGroup(userId, patch.groupId);
    return this.categoryRepo.update(userId, id, patch);
  }

  delete(userId: string, id: string): Promise<void> {
    return this.categoryRepo.delete(userId, id);
  }

  private async validateGroup(userId: string, groupId: string | null | undefined): Promise<void> {
    if (!groupId) return;
    const exists = await this.categoryGroupRepo.existsForUser(userId, groupId);
    if (!exists) throw new AppError("Category group not found", 404, "CATEGORY_GROUP_NOT_FOUND");
  }
}
