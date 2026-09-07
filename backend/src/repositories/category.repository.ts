import { BaseRepository } from "./BaseRepository";
import { FinanceCategory, FinanceTransactionType } from "../types/finance.types";

interface CategoryRow {
  id: string;
  user_id: string;
  name: string;
  main_category: string | null;
  type: FinanceTransactionType;
  is_fixed: boolean;
  sort_order: number;
}

function toCategory(row: CategoryRow): FinanceCategory {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    mainCategory: row.main_category,
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
      .select("*")
      .eq("user_id", userId)
      .is("deleted_at", null)
      .order("main_category", { ascending: true })
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
        .select("id, user_id, name, main_category, type, is_fixed, sort_order")
        .eq("user_id", userId)
        .eq("id", id)
        .is("deleted_at", null)
        .maybeSingle(),
    );
    return Boolean(row);
  }
}
