import { useQuery } from "@tanstack/react-query";
import { categoriesApi } from "@/api/categories.api";
import { UserCategory } from "@/types/category.types";

export function useCategories() {
  const query = useQuery<UserCategory[]>({
    queryKey: ["categories"],
    queryFn: categoriesApi.getAll,
    staleTime: Infinity,
  });

  return {
    categories: query.data ?? [],
    loading: query.isLoading,
    error: query.isError ? "Failed to load categories" : null,
  };
}
