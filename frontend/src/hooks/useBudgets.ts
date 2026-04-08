import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { budgetsApi } from "@/api/budgets.api";
import { Budget, CreateBudgetDto, UpdateBudgetDto } from "@/types/budget.types";

function currentMonthYear() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export function useBudgets() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["budgets"],
    queryFn: async (): Promise<Budget[]> => {
      await budgetsApi.rollover(currentMonthYear());
      return budgetsApi.list();
    },
    staleTime: 10 * 60 * 1000,
  });

  const budgets = query.data ?? [];

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["budgets"] });

  const createMutation = useMutation({
    mutationFn: (dto: CreateBudgetDto) => budgetsApi.create(dto),
    onSuccess: invalidate,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateBudgetDto }) =>
      budgetsApi.update(id, dto),
    onSuccess: invalidate,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => budgetsApi.delete(id),
    onSuccess: invalidate,
  });

  const createBudget = (dto: CreateBudgetDto) => createMutation.mutateAsync(dto);
  const updateBudget = (id: string, dto: UpdateBudgetDto) => updateMutation.mutateAsync({ id, dto });
  const deleteBudget = (id: string) => deleteMutation.mutateAsync(id);

  return {
    budgets,
    loading: query.isLoading,
    error: query.isError ? "Failed to load budgets" : null,
    refetch: invalidate,
    createBudget,
    updateBudget,
    deleteBudget,
  };
}
