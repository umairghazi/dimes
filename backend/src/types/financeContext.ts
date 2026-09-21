import type { CategoryService } from "../services/category.service";
import type { MonthlySummaryService } from "../services/monthlySummary.service";
import type { TransactionService } from "../services/transaction.service";

export interface FinanceContext {
  user: { id: string; email: string };
  transactionService: TransactionService;
  categoryService: CategoryService;
  monthlySummaryService: MonthlySummaryService;
}
