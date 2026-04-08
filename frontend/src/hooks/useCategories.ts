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
  for (const item of standalones) {
    groups.push({ group: null, items: [item] });
  }

  return groups;
}

export function useCategories() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["categories"],
    queryFn: categoriesApi.getAll,
    staleTime: Infinity,
  });

  const categories = query.data ?? [];
  const tree = useMemo(() => buildTree(categories), [categories]);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["categories"] });

  const addMutation = useMutation({
    mutationFn: ({ name, group }: { name: string; group?: string }) =>
      categoriesApi.create({ name, group }),
    onSuccess: invalidate,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { name?: string; group?: string | null } }) =>
      categoriesApi.update(id, data),
    onSuccess: invalidate,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => categoriesApi.delete(id),
    onSuccess: invalidate,
  });

  const addCategory = (name: string, group?: string) =>
    addMutation.mutateAsync({ name, group });

  const updateCategory = (id: string, data: { name?: string; group?: string | null }) =>
    updateMutation.mutateAsync({ id, data });

  const deleteCategory = (id: string) => deleteMutation.mutateAsync(id);

  return {
    categories,
    tree,
    loading: query.isLoading,
    error: query.isError ? "Failed to load categories" : null,
    addCategory,
    updateCategory,
    deleteCategory,
    reload: invalidate,
  };
}
