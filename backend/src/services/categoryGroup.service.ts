import {
  CategoryGroupRepository,
  CreateCategoryGroupData,
  UpdateCategoryGroupData,
} from "../repositories/categoryGroup.repository";
import { CategoryRepository } from "../repositories/category.repository";
import { FinanceCategoryGroup, FinanceTransactionType } from "../types/finance.types";

export class CategoryGroupService {
  constructor(
    private readonly categoryGroupRepo = new CategoryGroupRepository(),
    private readonly categoryRepo = new CategoryRepository(),
  ) {}

  list(userId: string, type?: FinanceTransactionType): Promise<FinanceCategoryGroup[]> {
    return this.categoryGroupRepo.listByUser(userId, type);
  }

  create(userId: string, data: CreateCategoryGroupData): Promise<FinanceCategoryGroup> {
    return this.categoryGroupRepo.create(userId, data);
  }

  update(userId: string, id: string, patch: UpdateCategoryGroupData): Promise<FinanceCategoryGroup> {
    return this.categoryGroupRepo.update(userId, id, patch);
  }

  async delete(userId: string, id: string): Promise<void> {
    await this.categoryRepo.clearGroup(userId, id);
    await this.categoryGroupRepo.delete(userId, id);
  }
}
