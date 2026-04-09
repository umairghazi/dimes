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

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ["expenses"] });
    queryClient.invalidateQueries({ queryKey: ["analytics"] });
  };

  const deleteMutation = useMutation({
    mutationFn: (id: string) => expensesApi.delete(id),
    onSuccess: invalidateAll,
  });

  return {
    data: query.data ?? null,
    loading: query.isLoading,
    error: query.isError ? "Failed to load expenses" : null,
    refetch: () => queryClient.invalidateQueries({ queryKey: ["expenses"] }),
    deleteExpense: (id: string) => deleteMutation.mutateAsync(id),
  };
}
