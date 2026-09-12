import { BaseRepository } from "./BaseRepository";
import { FinanceCategoryGroup, FinanceTransactionType } from "../types/finance.types";

interface CategoryGroupRow {
  id: string;
  user_id: string;
  name: string;
  type: FinanceTransactionType;
  sort_order: number;
}

export interface CreateCategoryGroupData {
  name: string;
  type?: FinanceTransactionType;
  sortOrder?: number;
}

export type UpdateCategoryGroupData = Partial<CreateCategoryGroupData>;

function toCategoryGroup(row: CategoryGroupRow): FinanceCategoryGroup {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    type: row.type,
    sortOrder: row.sort_order,
  };
}

export class CategoryGroupRepository extends BaseRepository {
  constructor() {
    super("category_groups");
  }

  async listByUser(userId: string, type?: FinanceTransactionType): Promise<FinanceCategoryGroup[]> {
    let query = this.table()
      .select("id, user_id, name, type, sort_order")
      .eq("user_id", userId)
      .is("deleted_at", null)
      .order("type", { ascending: true })
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true });
    if (type) query = query.eq("type", type);

    const rows = await this.execute<CategoryGroupRow[]>("list category groups", query);
    return (rows ?? []).map(toCategoryGroup);
  }

  async existsForUser(userId: string, id: string): Promise<boolean> {
    const row = await this.execute<CategoryGroupRow | null>(
      "find category group",
      this.table()
        .select("id, user_id, name, type, sort_order")
        .eq("user_id", userId)
        .eq("id", id)
        .is("deleted_at", null)
        .maybeSingle(),
    );
    return Boolean(row);
  }

  async create(userId: string, data: CreateCategoryGroupData): Promise<FinanceCategoryGroup> {
    const row = await this.execute<CategoryGroupRow>(
      "create category group",
      this.table()
        .insert({
          user_id: userId,
          name: data.name,
          type: data.type ?? "expense",
          sort_order: data.sortOrder ?? 0,
        })
        .select("id, user_id, name, type, sort_order")
        .single(),
    );
    return toCategoryGroup(row);
  }

  async update(userId: string, id: string, patch: UpdateCategoryGroupData): Promise<FinanceCategoryGroup> {
    const data: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (patch.name !== undefined) data.name = patch.name;
    if (patch.type !== undefined) data.type = patch.type;
    if (patch.sortOrder !== undefined) data.sort_order = patch.sortOrder;

    const row = await this.execute<CategoryGroupRow>(
      "update category group",
      this.table()
        .update(data)
        .eq("user_id", userId)
        .eq("id", id)
        .is("deleted_at", null)
        .select("id, user_id, name, type, sort_order")
        .single(),
    );
    return toCategoryGroup(row);
  }

  async delete(userId: string, id: string): Promise<void> {
    await this.executeEmpty(
      "delete category group",
      this.table()
        .update({ deleted_at: new Date().toISOString(), updated_at: new Date().toISOString() })
        .eq("user_id", userId)
        .eq("id", id),
    );
  }
}
