import { BaseRepository } from "./BaseRepository";
import { FinanceTransaction, FinanceTransactionType, money, monthBounds } from "../types/finance.types";

interface TransactionRow {
  id: string;
  user_id: string;
  date: string;
  description: string;
  amount: string | number;
  currency: string;
  category_id: string | null;
  main_category: string | null;
  type: FinanceTransactionType;
  merchant_name: string | null;
  source: string;
  is_recurring: boolean;
  tags: string[] | null;
  original_description: string | null;
  created_at: string;
  updated_at: string;
  category_name: string | null;
  category_main_category: string | null;
}

export interface TransactionFilters {
  month?: string;
  type?: FinanceTransactionType;
}

export interface CreateTransactionData {
  date: string;
  description: string;
  amount: number;
  currency?: string;
  categoryId?: string | null;
  mainCategory?: string | null;
  type?: FinanceTransactionType;
  merchantName?: string | null;
  source?: string;
  isRecurring?: boolean;
  tags?: string[];
  originalDescription?: string | null;
}

export type UpdateTransactionData = Partial<CreateTransactionData>;

function toTransaction(row: TransactionRow): FinanceTransaction {
  const category = row.category_name ?? "Uncategorized";
  return {
    id: row.id,
    userId: row.user_id,
    date: row.date,
    description: row.description,
    amount: money(row.amount),
    currency: row.currency,
    categoryId: row.category_id,
    category,
    mainCategory: row.main_category ?? row.category_main_category ?? category.split(" - ")[0] ?? category,
    type: row.type,
    merchantName: row.merchant_name,
    source: row.source,
    isRecurring: row.is_recurring,
    tags: row.tags ?? [],
    originalDescription: row.original_description,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class TransactionRepository extends BaseRepository {
  async listByUser(userId: string, filters: TransactionFilters = {}): Promise<FinanceTransaction[]> {
    const params: unknown[] = [userId];
    const predicates = ["t.user_id = $1"];

    if (filters.month) {
      const { from, to } = monthBounds(filters.month);
      params.push(from, to);
      predicates.push(`t.date >= $${params.length - 1}`, `t.date <= $${params.length}`);
    }
    if (filters.type) {
      params.push(filters.type);
      predicates.push(`t.type = $${params.length}`);
    }

    const rows = await this.query<TransactionRow>(
      "list transactions",
      `
      select
        t.*,
        c.name as category_name,
        c.main_category as category_main_category
      from public.transactions t
      left join public.categories c on c.id = t.category_id
      where ${predicates.join(" and ")}
      order by t.date desc, t.created_at desc
      `,
      params,
    );

    return rows.map(toTransaction);
  }

  async create(userId: string, data: CreateTransactionData): Promise<FinanceTransaction> {
    const row = await this.queryOne<TransactionRow>(
      "create transaction",
      `
      with inserted as (
        insert into public.transactions (
          user_id,
          date,
          description,
          amount,
          currency,
          category_id,
          main_category,
          type,
          merchant_name,
          source,
          is_recurring,
          tags,
          original_description
        )
        values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        returning *
      )
      select
        inserted.*,
        c.name as category_name,
        c.main_category as category_main_category
      from inserted
      left join public.categories c on c.id = inserted.category_id
      `,
      [
        userId,
        data.date,
        data.description,
        data.amount,
        data.currency ?? "CAD",
        data.categoryId ?? null,
        data.mainCategory ?? null,
        data.type ?? "expense",
        data.merchantName ?? null,
        data.source ?? "manual",
        data.isRecurring ?? false,
        data.tags ?? [],
        data.originalDescription ?? null,
      ],
    );

    if (!row) throw new Error("Transaction insert returned no row");
    return toTransaction(row);
  }

  async update(userId: string, id: string, patch: UpdateTransactionData): Promise<FinanceTransaction> {
    const assignments: string[] = [];
    const values: unknown[] = [];
    const add = (column: string, value: unknown) => {
      values.push(value);
      assignments.push(`${column} = $${values.length}`);
    };

    add("updated_at", new Date().toISOString());
    if (patch.date !== undefined) add("date", patch.date);
    if (patch.description !== undefined) add("description", patch.description);
    if (patch.amount !== undefined) add("amount", patch.amount);
    if (patch.currency !== undefined) add("currency", patch.currency);
    if (patch.categoryId !== undefined) add("category_id", patch.categoryId);
    if (patch.mainCategory !== undefined) add("main_category", patch.mainCategory);
    if (patch.type !== undefined) add("type", patch.type);
    if (patch.merchantName !== undefined) add("merchant_name", patch.merchantName);
    if (patch.source !== undefined) add("source", patch.source);
    if (patch.isRecurring !== undefined) add("is_recurring", patch.isRecurring);
    if (patch.tags !== undefined) add("tags", patch.tags);
    if (patch.originalDescription !== undefined) add("original_description", patch.originalDescription);

    values.push(userId, id);
    const row = await this.queryOne<TransactionRow>(
      "update transaction",
      `
      with updated as (
        update public.transactions
        set ${assignments.join(", ")}
        where user_id = $${values.length - 1}
          and id = $${values.length}
        returning *
      )
      select
        updated.*,
        c.name as category_name,
        c.main_category as category_main_category
      from updated
      left join public.categories c on c.id = updated.category_id
      `,
      values,
    );

    if (!row) throw new Error("Transaction not found");
    return toTransaction(row);
  }

  async delete(userId: string, id: string): Promise<void> {
    await this.query(
      "delete transaction",
      `
      delete from public.transactions
      where user_id = $1
        and id = $2
      `,
      [userId, id],
    );
  }
}
