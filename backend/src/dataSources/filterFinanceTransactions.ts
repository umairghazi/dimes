import { FinanceTransaction, FinanceTransactionFilters } from "./FinanceDataSource";

function monthBounds(monthYear: string): { from: Date; to: Date } {
  const [year, month] = monthYear.split("-").map(Number);
  return {
    from: new Date(Date.UTC(year, month - 1, 1)),
    to: new Date(Date.UTC(year, month, 1) - 1),
  };
}

export function filterFinanceTransactions(
  rows: FinanceTransaction[],
  filters: FinanceTransactionFilters = {},
): FinanceTransaction[] {
  const bounds = filters.month ? monthBounds(filters.month) : null;

  return rows.filter((row) => {
    if (filters.type && row.type !== filters.type) return false;
    if (!bounds) return true;

    const date = new Date(row.date);
    return date >= bounds.from && date <= bounds.to;
  });
}
