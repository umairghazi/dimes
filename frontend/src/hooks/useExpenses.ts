import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { expensesApi } from "@/api/expenses.api";
import { Expense, ExpenseFilters, PaginatedExpenses } from "@/types/expense.types";

export function useExpenses(filters: ExpenseFilters = {}, page = 1, limit = 20) {
  const queryClient = useQueryClient();

  const query = useQuery<PaginatedExpenses>({
    queryKey: ["expenses", filters, page, limit],
    queryFn: () => expensesApi.list({ ...filters, page, limit }),
    staleTime: 2 * 60 * 1000,
  });

  const invalidateExpenses = () =>
    queryClient.invalidateQueries({ queryKey: ["expenses"] });

  const invalidateAnalytics = () =>
    queryClient.invalidateQueries({ queryKey: ["analytics"] });

  const invalidateAll = () => {
    invalidateExpenses();
    invalidateAnalytics();
  };

  const createMutation = useMutation({
    mutationFn: (dto: Omit<Expense, "id" | "userId" | "createdAt" | "updatedAt">) =>
      expensesApi.create(dto),
    onSuccess: invalidateAll,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: Partial<Expense> }) =>
      expensesApi.update(id, dto),
    onSuccess: invalidateAll,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => expensesApi.delete(id),
    onSuccess: invalidateAll,
  });

  const createExpense = (dto: Omit<Expense, "id" | "userId" | "createdAt" | "updatedAt">) =>
    createMutation.mutateAsync(dto);

  const updateExpense = (id: string, dto: Partial<Expense>) =>
    updateMutation.mutateAsync({ id, dto });

  const deleteExpense = (id: string) => deleteMutation.mutateAsync(id);

  return {
    data: query.data ?? null,
    loading: query.isLoading,
    error: query.isError ? "Failed to load expenses" : null,
    refetch: invalidateAll,
    createExpense,
    updateExpense,
    deleteExpense,
  };
}
