import { useState, useEffect, useCallback } from "react";
import { expensesApi } from "@/api/expenses.api";
import { Expense, ExpenseFilters, PaginatedExpenses } from "@/types/expense.types";

export function useExpenses(filters: ExpenseFilters = {}, page = 1, limit = 20) {
  const [data, setData] = useState<PaginatedExpenses | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await expensesApi.list({ ...filters, page, limit });
      setData(result);
    } catch {
      setError("Failed to load expenses");
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(filters), page, limit]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { void fetch(); }, [fetch]);

  const createExpense = async (dto: Omit<Expense, "id" | "userId" | "createdAt" | "updatedAt">) => {
    const created = await expensesApi.create(dto);
    void fetch();
    return created;
  };

  const updateExpense = async (id: string, dto: Partial<Expense>) => {
    const updated = await expensesApi.update(id, dto);
    void fetch();
    return updated;
  };

  const deleteExpense = async (id: string) => {
    await expensesApi.delete(id);
    void fetch();
  };

  return { data, loading, error, refetch: fetch, createExpense, updateExpense, deleteExpense };
}
