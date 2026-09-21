import { BaseRepository } from "./BaseRepository";
import { FinanceCategory, FinanceCategoryType } from "../types/finance.types";
import { SupabaseClient } from "@supabase/supabase-js";

interface CategoryRow {
  id: string;
  user_id: string;
  parent_id: string | null;
  name: string;
  type: FinanceCategoryType;
  is_fixed: boolean;
  sort_order: number;
}

export interface CreateCategoryData {
  name: string;
  parentId?: string | null;
  type?: FinanceCategoryType;
  isFixed?: boolean;
  sortOrder?: number;
}

export type UpdateCategoryData = Partial<CreateCategoryData>;

function buildPath(row: CategoryRow, byId: Map<string, CategoryRow>): Array<{ id: string; name: string }> {
  const path: Array<{ id: string; name: string }> = [];
  const seen = new Set<string>();
  let current: CategoryRow | undefined = row;

  while (current && !seen.has(current.id)) {
    seen.add(current.id);
    path.unshift({ id: current.id, name: current.name });
    current = current.parent_id ? byId.get(current.parent_id) : undefined;
  }

  return path;
}

function toCategory(row: CategoryRow, byId: Map<string, CategoryRow>, childCounts: Map<string, number>): FinanceCategory {
  const parent = row.parent_id ? byId.get(row.parent_id) : null;
  const path = buildPath(row, byId);
  return {
    id: row.id,
    userId: row.user_id,
    parentId: row.parent_id,
    parentName: parent?.name ?? null,
    name: row.name,
    type: row.type,
    isFixed: row.is_fixed,
    sortOrder: row.sort_order,
    depth: Math.max(0, path.length - 1),
    path,
    hasChildren: (childCounts.get(row.id) ?? 0) > 0,
  };
}

export class CategoryRepository extends BaseRepository {
  constructor(db: SupabaseClient) {
    super("categories", db);
  }

  async listByUser(userId: string, type?: FinanceCategoryType): Promise<FinanceCategory[]> {
    let query = this.table()
      .select("id, user_id, parent_id, name, type, is_fixed, sort_order")
      .eq("user_id", userId)
      .is("deleted_at", null)
      .order("parent_id", { ascending: true })
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true });
    if (type) query = query.eq("type", type);

    const rows = await this.execute<CategoryRow[]>("list categories", query);
    return this.toCategories(rows ?? []);
  }

  async findById(userId: string, id: string): Promise<FinanceCategory | null> {
    const categories = await this.listByUser(userId);
    return categories.find((category) => category.id === id) ?? null;
  }

  async existsForUser(userId: string, id: string): Promise<boolean> {
    const row = await this.execute<CategoryRow | null>(
      "find category",
      this.table()
        .select("id, user_id, parent_id, name, type, is_fixed, sort_order")
        .eq("user_id", userId)
        .eq("id", id)
        .is("deleted_at", null)
        .maybeSingle(),
    );
    return Boolean(row);
  }

  async create(userId: string, data: CreateCategoryData): Promise<FinanceCategory> {
    const row = await this.execute<CategoryRow>(
      "create category",
      this.table()
        .insert({
          user_id: userId,
          parent_id: data.parentId ?? null,
          name: data.name,
          type: data.type ?? "expense",
          is_fixed: data.isFixed ?? false,
          sort_order: data.sortOrder ?? 0,
        })
        .select("id, user_id, parent_id, name, type, is_fixed, sort_order")
        .single(),
    );
    const categories = await this.listByUser(userId);
    return categories.find((category) => category.id === row.id) ?? this.toCategories([row])[0];
  }

  async update(userId: string, id: string, patch: UpdateCategoryData): Promise<FinanceCategory> {
    const data: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (patch.name !== undefined) data.name = patch.name;
    if (patch.parentId !== undefined) data.parent_id = patch.parentId;
    if (patch.type !== undefined) data.type = patch.type;
    if (patch.isFixed !== undefined) data.is_fixed = patch.isFixed;
    if (patch.sortOrder !== undefined) data.sort_order = patch.sortOrder;

    const row = await this.execute<CategoryRow>(
      "update category",
      this.table()
        .update(data)
        .eq("user_id", userId)
        .eq("id", id)
        .is("deleted_at", null)
        .select("id, user_id, parent_id, name, type, is_fixed, sort_order")
        .single(),
    );
    const categories = await this.listByUser(userId);
    return categories.find((category) => category.id === row.id) ?? this.toCategories([row])[0];
  }

  async delete(userId: string, id: string): Promise<void> {
    await this.executeEmpty(
      "delete category",
      this.table()
        .update({ deleted_at: new Date().toISOString(), updated_at: new Date().toISOString() })
        .eq("user_id", userId)
        .eq("id", id),
    );
  }

  async clearParent(userId: string, parentId: string): Promise<void> {
    await this.executeEmpty(
      "clear category parent",
      this.table()
        .update({ parent_id: null, updated_at: new Date().toISOString() })
        .eq("user_id", userId)
        .eq("parent_id", parentId),
    );
  }

  private toCategories(rows: CategoryRow[]): FinanceCategory[] {
    const byId = new Map(rows.map((row) => [row.id, row]));
    const childCounts = new Map<string, number>();
    rows.forEach((row) => {
      if (row.parent_id) childCounts.set(row.parent_id, (childCounts.get(row.parent_id) ?? 0) + 1);
    });
    return rows.map((row) => toCategory(row, byId, childCounts));
  }
}
