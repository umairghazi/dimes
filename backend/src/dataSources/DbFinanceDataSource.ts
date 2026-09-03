import { ExpenseRepository } from "../repositories/expense.repository";
import {
  FinanceDataSource,
  FinanceDataSourceStatus,
  FinanceTransaction,
  FinanceTransactionFilters,
} from "./FinanceDataSource";
import { filterFinanceTransactions } from "./filterFinanceTransactions";

type ResolvedExpense = Awaited<ReturnType<ExpenseRepository["filterExpenses"]>>[number] & {
  category: string;
};

function mainCategory(category: string): string {
  return category.includes(" - ") ? category.split(" - ")[0] : category;
}

export class DbFinanceDataSource implements FinanceDataSource {
  constructor(private readonly expenseRepo = new ExpenseRepository()) {}

  status(): FinanceDataSourceStatus {
    return {
      provider: "db",
      configured: true,
      readOnly: false,
      details: { backingStore: "mongodb" },
    };
  }

  async listTransactions(userId: string, filters: FinanceTransactionFilters = {}): Promise<FinanceTransaction[]> {
    const rows = await this.expenseRepo.filterExpenses({
      userId,
      type: filters.type,
    });

    const resolvedRows = rows as ResolvedExpense[];

    return filterFinanceTransactions(
      resolvedRows.map((row) => ({
        id: row.id,
        date: row.date instanceof Date ? row.date.toISOString() : new Date(row.date).toISOString(),
        description: row.description,
        amount: row.amount,
        category: row.category,
        mainCategory: mainCategory(row.category),
        type: row.type === "income" ? "income" : "expense",
        source: "db",
      })),
      filters,
    );
  }
}
