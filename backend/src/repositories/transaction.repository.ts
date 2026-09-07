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
  categories?: { name: string; main_category: string | null } | null;
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
  const category = row.categories?.name ?? "Uncategorized";
  return {
    id: row.id,
    userId: row.user_id,
    date: row.date,
    description: row.description,
    amount: money(row.amount),
    currency: row.currency,
    categoryId: row.category_id,
    category,
    mainCategory: row.main_category ?? row.categories?.main_category ?? category.split(" - ")[0] ?? category,
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
  constructor() {
    super("transactions");
  }

  async listByUser(userId: string, filters: TransactionFilters = {}): Promise<FinanceTransaction[]> {
    let query = this.table()
      .select("*, categories(name, main_category)")
      .eq("user_id", userId)
      .order("date", { ascending: false })
      .order("created_at", { ascending: false });

    if (filters.month) {
      const { from, to } = monthBounds(filters.month);
      query = query.gte("date", from).lte("date", to);
    }
    if (filters.type) query = query.eq("type", filters.type);

    const rows = await this.execute<TransactionRow[]>("list transactions", query);
    return (rows ?? []).map(toTransaction);
  }

  async create(userId: string, data: CreateTransactionData): Promise<FinanceTransaction> {
    const row = await this.execute<TransactionRow>(
      "create transaction",
      this.table()
        .insert({
          user_id: userId,
          date: data.date,
          description: data.description,
          amount: data.amount,
          currency: data.currency ?? "CAD",
          category_id: data.categoryId ?? null,
          main_category: data.mainCategory ?? null,
          type: data.type ?? "expense",
          merchant_name: data.merchantName ?? null,
          source: data.source ?? "manual",
          is_recurring: data.isRecurring ?? false,
          tags: data.tags ?? [],
          original_description: data.originalDescription ?? null,
        })
        .select("*, categories(name, main_category)")
        .single(),
    );

    return toTransaction(row);
  }

  async update(userId: string, id: string, patch: UpdateTransactionData): Promise<FinanceTransaction> {
    const data: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (patch.date !== undefined) data.date = patch.date;
    if (patch.description !== undefined) data.description = patch.description;
    if (patch.amount !== undefined) data.amount = patch.amount;
    if (patch.currency !== undefined) data.currency = patch.currency;
    if (patch.categoryId !== undefined) data.category_id = patch.categoryId;
    if (patch.mainCategory !== undefined) data.main_category = patch.mainCategory;
    if (patch.type !== undefined) data.type = patch.type;
    if (patch.merchantName !== undefined) data.merchant_name = patch.merchantName;
    if (patch.source !== undefined) data.source = patch.source;
    if (patch.isRecurring !== undefined) data.is_recurring = patch.isRecurring;
    if (patch.tags !== undefined) data.tags = patch.tags;
    if (patch.originalDescription !== undefined) data.original_description = patch.originalDescription;

    const row = await this.execute<TransactionRow>(
      "update transaction",
      this.table()
        .update(data)
        .eq("user_id", userId)
        .eq("id", id)
        .select("*, categories(name, main_category)")
        .single(),
    );

    return toTransaction(row);
  }

  async delete(userId: string, id: string): Promise<void> {
    await this.executeEmpty(
      "delete transaction",
      this.table()
        .delete()
        .eq("user_id", userId)
        .eq("id", id),
    );
  }
}
