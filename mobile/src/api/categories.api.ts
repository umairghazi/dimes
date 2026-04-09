import { apiClient } from "./client";
import { UserCategory } from "@/types/category.types";

export const categoriesApi = {
  getAll: () => apiClient.get<UserCategory[]>("/categories").then((r) => r.data),
};
