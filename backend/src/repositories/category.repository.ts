import { BaseRepository } from "./BaseRepository";
import { FinanceCategory, FinanceTransactionType } from "../types/finance.types";

interface CategoryRow {
  id: string;
  user_id: string;
  group_id: string | null;
  name: string;
  main_category: string | null;
  type: FinanceTransactionType;
  is_fixed: boolean;
  sort_order: number;
  category_groups?: { name: string } | null;
}

export interface CreateCategoryData {
  name: string;
  groupId?: string | null;
  type?: FinanceTransactionType;
  isFixed?: boolean;
  sortOrder?: number;
}

export type UpdateCategoryData = Partial<CreateCategoryData>;

function toCategory(row: CategoryRow): FinanceCategory {
  return {
    id: row.id,
    userId: row.user_id,
    groupId: row.group_id,
    groupName: row.category_groups?.name ?? row.main_category,
    name: row.name,
    mainCategory: row.category_groups?.name ?? row.main_category,
    type: row.type,
    isFixed: row.is_fixed,
    sortOrder: row.sort_order,
  };
}

export class CategoryRepository extends BaseRepository {
  constructor() {
    super("categories");
  }

  async listByUser(userId: string, type?: FinanceTransactionType): Promise<FinanceCategory[]> {
    let query = this.table()
      .select("id, user_id, group_id, name, main_category, type, is_fixed, sort_order, category_groups(name)")
      .eq("user_id", userId)
      .is("deleted_at", null)
      .order("group_id", { ascending: true })
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true });
    if (type) query = query.eq("type", type);

    const rows = await this.execute<CategoryRow[]>("list categories", query);
    return (rows ?? []).map(toCategory);
  }

  async existsForUser(userId: string, id: string): Promise<boolean> {
    const row = await this.execute<CategoryRow | null>(
      "find category",
      this.table()
        .select("id, user_id, group_id, name, main_category, type, is_fixed, sort_order")
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
          group_id: data.groupId ?? null,
          name: data.name,
          type: data.type ?? "expense",
          is_fixed: data.isFixed ?? false,
          sort_order: data.sortOrder ?? 0,
        })
        .select("id, user_id, group_id, name, main_category, type, is_fixed, sort_order, category_groups(name)")
        .single(),
    );
    return toCategory(row);
  }

  async update(userId: string, id: string, patch: UpdateCategoryData): Promise<FinanceCategory> {
    const data: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (patch.name !== undefined) data.name = patch.name;
    if (patch.groupId !== undefined) data.group_id = patch.groupId;
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
        .select("id, user_id, group_id, name, main_category, type, is_fixed, sort_order, category_groups(name)")
        .single(),
    );
    return toCategory(row);
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

  async clearGroup(userId: string, groupId: string): Promise<void> {
    await this.executeEmpty(
      "clear category group",
      this.table()
        .update({ group_id: null, updated_at: new Date().toISOString() })
        .eq("user_id", userId)
        .eq("group_id", groupId),
    );
  }
}
