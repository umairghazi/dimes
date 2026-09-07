import { CategoryRepository, CreateCategoryData, UpdateCategoryData } from "../repositories/category.repository";
import { FinanceCategory, FinanceTransactionType } from "../types/finance.types";

export class CategoryService {
  constructor(private readonly categoryRepo = new CategoryRepository()) {}

  list(userId: string, type?: FinanceTransactionType): Promise<FinanceCategory[]> {
    return this.categoryRepo.listByUser(userId, type);
  }

  create(userId: string, data: CreateCategoryData): Promise<FinanceCategory> {
    return this.categoryRepo.create(userId, data);
  }

  update(userId: string, id: string, patch: UpdateCategoryData): Promise<FinanceCategory> {
    return this.categoryRepo.update(userId, id, patch);
  }

  delete(userId: string, id: string): Promise<void> {
    return this.categoryRepo.delete(userId, id);
  }
}
