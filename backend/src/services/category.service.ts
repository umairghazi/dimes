import { CategoryRepository } from "../repositories/category.repository";
import { FinanceCategory, FinanceTransactionType } from "../types/finance.types";

export class CategoryService {
  constructor(private readonly categoryRepo = new CategoryRepository()) {}

  list(userId: string, type?: FinanceTransactionType): Promise<FinanceCategory[]> {
    return this.categoryRepo.listByUser(userId, type);
  }
}
