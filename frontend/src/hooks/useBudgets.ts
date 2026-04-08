import { useState, useEffect, useCallback } from "react";
import { budgetsApi } from "@/api/budgets.api";
import { Budget, CreateBudgetDto, UpdateBudgetDto } from "@/types/budget.types";

function currentMonthYear() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export function useBudgets() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await budgetsApi.rollover(currentMonthYear());
      const data = await budgetsApi.list();
      setBudgets(data);
    } catch {
      setError("Failed to load budgets");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void fetch(); }, [fetch]);

  const createBudget = async (dto: CreateBudgetDto) => {
    const budget = await budgetsApi.create(dto);
    void fetch();
    return budget;
  };

  const updateBudget = async (id: string, dto: UpdateBudgetDto) => {
    const updated = await budgetsApi.update(id, dto);
    void fetch();
    return updated;
  };

  const deleteBudget = async (id: string) => {
    await budgetsApi.delete(id);
    void fetch();
  };

  return { budgets, loading, error, refetch: fetch, createBudget, updateBudget, deleteBudget };
}
