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
  async listByUser(userId: string, type?: FinanceTransactionType): Promise<FinanceCategory[]> {
    const params: unknown[] = [userId];
    const predicates = ["user_id = $1", "deleted_at is null"];

    if (type) {
      params.push(type);
      predicates.push(`type = $${params.length}`);
    }

    const rows = await this.query<CategoryRow>(
      "list categories",
      `
      select
        id,
        user_id,
        name,
        main_category,
        type,
        is_fixed,
        sort_order
      from public.categories
      where ${predicates.join(" and ")}
      order by main_category asc nulls last, sort_order asc, name asc
      `,
      params,
    );

    return rows.map(toCategory);
  }

  async existsForUser(userId: string, id: string): Promise<boolean> {
    const row = await this.queryOne<{ id: string }>(
      "find category",
      `
      select id
      from public.categories
      where user_id = $1
        and id = $2
        and deleted_at is null
      limit 1
      `,
      [userId, id],
    );

    return Boolean(row);
  }
}
