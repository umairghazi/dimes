import { useState, useEffect, useCallback } from "react";
import { categoriesApi } from "@/api/categories.api";
import { UserCategory, CategoryGroup } from "@/types/category.types";

function buildTree(categories: UserCategory[]): CategoryGroup[] {
  const groupMap = new Map<string | null, UserCategory[]>();

  for (const cat of categories) {
    const key = cat.group ?? null;
    if (!groupMap.has(key)) groupMap.set(key, []);
    groupMap.get(key)!.push(cat);
  }

  // Groups with a name come first (sorted), then standalones (null group)
  const groups: CategoryGroup[] = [];

  // Named groups
  for (const [group, items] of groupMap.entries()) {
    if (group !== null) {
      groups.push({ group, items });
    }
  }
  groups.sort((a, b) => (a.group ?? "").localeCompare(b.group ?? ""));

  // Standalones — each is its own "group" entry with group=null
  const standalones = groupMap.get(null) ?? [];
  for (const item of standalones) {
    groups.push({ group: null, items: [item] });
  }

  return groups;
}

export function useCategories() {
  const [categories, setCategories] = useState<UserCategory[]>([]);
  const [tree, setTree] = useState<CategoryGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await categoriesApi.getAll();
      setCategories(data);
      setTree(buildTree(data));
    } catch {
      setError("Failed to load categories");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const addCategory = async (name: string, group?: string) => {
    const created = await categoriesApi.create({ name, group });
    setCategories((prev) => {
      const next = [...prev, created];
      setTree(buildTree(next));
      return next;
    });
    return created;
  };

  const updateCategory = async (id: string, data: { name?: string; group?: string | null }) => {
    const updated = await categoriesApi.update(id, data);
    setCategories((prev) => {
      const next = prev.map((c) => (c.id === id ? updated : c));
      setTree(buildTree(next));
      return next;
    });
    return updated;
  };

  const deleteCategory = async (id: string) => {
    await categoriesApi.delete(id);
    setCategories((prev) => {
      const next = prev.filter((c) => c.id !== id);
      setTree(buildTree(next));
      return next;
    });
  };

  return { categories, tree, loading, error, addCategory, updateCategory, deleteCategory, reload: load };
}
