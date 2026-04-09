import { apiClient } from "./client";
import { UserCategory } from "@/types/category.types";

export const categoriesApi = {
  getAll: () =>
    apiClient.get<UserCategory[]>("/categories").then((r) => r.data),

  getAllIncludingDeleted: () =>
    apiClient.get<UserCategory[]>("/categories/all").then((r) => r.data),

  create: (data: { name: string; group?: string }) =>
    apiClient.post<UserCategory>("/categories", data).then((r) => r.data),

  update: (id: string, data: { name?: string; group?: string | null }) =>
    apiClient.put<UserCategory>(`/categories/${id}`, data).then((r) => r.data),

  delete: (id: string) =>
    apiClient.delete(`/categories/${id}`),

  restore: (id: string) =>
    apiClient.post<UserCategory>(`/categories/${id}/restore`).then((r) => r.data),
};
