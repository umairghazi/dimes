import { useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { categoriesApi } from "@/api/categories.api";
import { UserCategory, CategoryGroup } from "@/types/category.types";

function buildTree(categories: UserCategory[]): CategoryGroup[] {
  const groupMap = new Map<string | null, UserCategory[]>();

  for (const cat of categories) {
    const key = cat.group ?? null;
    if (!groupMap.has(key)) groupMap.set(key, []);
    groupMap.get(key)!.push(cat);
  }

  const groups: CategoryGroup[] = [];

  for (const [group, items] of groupMap.entries()) {
    if (group !== null) {
      groups.push({ group, items });
    }
  }
  groups.sort((a, b) => (a.group ?? "").localeCompare(b.group ?? ""));

  const standalones = groupMap.get(null) ?? [];
  if (standalones.length > 0) {
    groups.push({ group: null, items: standalones });
  }

  return groups;
}

export function useCategories({ includeDeleted = false } = {}) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["categories", includeDeleted],
    queryFn: includeDeleted ? categoriesApi.getAllIncludingDeleted : categoriesApi.getAll,
    staleTime: Infinity,
  });

  const categories = query.data ?? [];
  const tree = useMemo(() => buildTree(categories), [categories]);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["categories"] });

  const addMutation = useMutation({
    mutationFn: ({ name, group, type, isFixed }: { name: string; group?: string; type?: "expense" | "income"; isFixed?: boolean }) =>
      categoriesApi.create({ name, group, type, isFixed }),
    onSuccess: invalidate,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { name?: string; group?: string | null; type?: "expense" | "income" | null; isFixed?: boolean } }) =>
      categoriesApi.update(id, data),
    onSuccess: invalidate,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => categoriesApi.delete(id),
    onSuccess: invalidate,
  });

  const restoreMutation = useMutation({
    mutationFn: (id: string) => categoriesApi.restore(id),
    onSuccess: invalidate,
  });

  const addCategory = (name: string, group?: string, type?: "expense" | "income", isFixed?: boolean) =>
    addMutation.mutateAsync({ name, group, type, isFixed });

  const updateCategory = (id: string, data: { name?: string; group?: string | null; type?: "expense" | "income" | null; isFixed?: boolean }) =>
    updateMutation.mutateAsync({ id, data });

  const deleteCategory = (id: string) => deleteMutation.mutateAsync(id);

  const restoreCategory = (id: string) => restoreMutation.mutateAsync(id);

  return {
    categories,
    tree,
    loading: query.isLoading,
    error: query.isError ? "Failed to load categories" : null,
    addCategory,
    updateCategory,
    deleteCategory,
    restoreCategory,
    reload: invalidate,
  };
}
