import { getSupabaseAdminClient } from "../integrations/supabase/supabaseAdmin.client";
import { RepositoryError } from "../errors/RepositoryError";

export type FinanceTransactionType = "expense" | "income";

export interface FinanceTransaction {
  id: string;
  userId: string;
  date: string;
  description: string;
  amount: number;
  currency: string;
  categoryId: string | null;
  category: string;
  mainCategory: string;
  type: FinanceTransactionType;
  merchantName: string | null;
  source: string;
  isRecurring: boolean;
  tags: string[];
  originalDescription: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface FinanceCategory {
  id: string;
  userId: string;
  name: string;
  mainCategory: string | null;
  type: FinanceTransactionType;
  isFixed: boolean;
  sortOrder: number;
}

export interface MonthlyPlan {
  id: string;
  userId: string;
  monthYear: string;
  categoryId: string | null;
  categoryName: string;
  type: FinanceTransactionType;
  plannedAmount: number;
  currency: string;
  carryForward: boolean;
}

export interface MonthlyBalance {
  id: string;
  userId: string;
  monthYear: string;
  startingBalance: number;
  endingBalance: number | null;
  currency: string;
}

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

interface CategoryRow {
  id: string;
  user_id: string;
  name: string;
  main_category: string | null;
  type: FinanceTransactionType;
  is_fixed: boolean;
  sort_order: number;
}

interface PlanRow {
  id: string;
  user_id: string;
  month_year: string;
  category_id: string | null;
  category_name: string;
  type: FinanceTransactionType;
  planned_amount: string | number;
  currency: string;
  carry_forward: boolean;
}

interface BalanceRow {
  id: string;
  user_id: string;
  month_year: string;
  starting_balance: string | number;
  ending_balance: string | number | null;
  currency: string;
}

function monthBounds(monthYear: string): { from: string; to: string } {
  const [year, month] = monthYear.split("-").map(Number);
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return {
    from: `${year}-${String(month).padStart(2, "0")}-01`,
    to: `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`,
  };
}

function money(value: string | number | null): number {
  if (value === null) return 0;
  const numberValue = typeof value === "number" ? value : Number(value);
  return Number.isFinite(numberValue) ? numberValue : 0;
}

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

function toPlan(row: PlanRow): MonthlyPlan {
  return {
    id: row.id,
    userId: row.user_id,
    monthYear: row.month_year,
    categoryId: row.category_id,
    categoryName: row.category_name,
    type: row.type,
    plannedAmount: money(row.planned_amount),
    currency: row.currency,
    carryForward: row.carry_forward,
  };
}

function toBalance(row: BalanceRow): MonthlyBalance {
  return {
    id: row.id,
    userId: row.user_id,
    monthYear: row.month_year,
    startingBalance: money(row.starting_balance),
    endingBalance: row.ending_balance === null ? null : money(row.ending_balance),
    currency: row.currency,
  };
}

export class FinanceRepository {
  private readonly supabase = getSupabaseAdminClient();

  async listTransactions(
    userId: string,
    filters: { month?: string; type?: FinanceTransactionType } = {},
  ): Promise<FinanceTransaction[]> {
    try {
      let query = this.supabase
        .from("transactions")
        .select("*, categories(name, main_category)")
        .eq("user_id", userId)
        .order("date", { ascending: false });

      if (filters.month) {
        const { from, to } = monthBounds(filters.month);
        query = query.gte("date", from).lte("date", to);
      }
      if (filters.type) query = query.eq("type", filters.type);

      const { data, error } = await query;
      if (error) throw error;
      return ((data ?? []) as TransactionRow[]).map(toTransaction);
    } catch (err) {
      throw new RepositoryError("Failed to list transactions", "listTransactions", err);
    }
  }

  async createTransaction(
    userId: string,
    data: {
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
    },
  ): Promise<FinanceTransaction> {
    try {
      const { data: row, error } = await this.supabase
        .from("transactions")
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
        .single();

      if (error) throw error;
      return toTransaction(row as TransactionRow);
    } catch (err) {
      throw new RepositoryError("Failed to create transaction", "createTransaction", err);
    }
  }

  async updateTransaction(
    userId: string,
    id: string,
    patch: Partial<{
      date: string;
      description: string;
      amount: number;
      currency: string;
      categoryId: string | null;
      mainCategory: string | null;
      type: FinanceTransactionType;
      merchantName: string | null;
      source: string;
      isRecurring: boolean;
      tags: string[];
      originalDescription: string | null;
    }>,
  ): Promise<FinanceTransaction> {
    try {
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

      const { data: row, error } = await this.supabase
        .from("transactions")
        .update(data)
        .eq("user_id", userId)
        .eq("id", id)
        .select("*, categories(name, main_category)")
        .single();

      if (error) throw error;
      return toTransaction(row as TransactionRow);
    } catch (err) {
      throw new RepositoryError("Failed to update transaction", "updateTransaction", err);
    }
  }

  async deleteTransaction(userId: string, id: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from("transactions")
        .delete()
        .eq("user_id", userId)
        .eq("id", id);
      if (error) throw error;
    } catch (err) {
      throw new RepositoryError("Failed to delete transaction", "deleteTransaction", err);
    }
  }

  async listCategories(userId: string, type?: FinanceTransactionType): Promise<FinanceCategory[]> {
    try {
      let query = this.supabase
        .from("categories")
        .select("*")
        .eq("user_id", userId)
        .is("deleted_at", null)
        .order("main_category", { ascending: true })
        .order("sort_order", { ascending: true })
        .order("name", { ascending: true });
      if (type) query = query.eq("type", type);

      const { data, error } = await query;
      if (error) throw error;
      return ((data ?? []) as CategoryRow[]).map(toCategory);
    } catch (err) {
      throw new RepositoryError("Failed to list categories", "listCategories", err);
    }
  }

  async listMonthlyPlans(userId: string, monthYear: string): Promise<MonthlyPlan[]> {
    try {
      const { data, error } = await this.supabase
        .from("monthly_plans")
        .select("*")
        .eq("user_id", userId)
        .eq("month_year", monthYear)
        .order("type", { ascending: true })
        .order("category_name", { ascending: true });
      if (error) throw error;
      return ((data ?? []) as PlanRow[]).map(toPlan);
    } catch (err) {
      throw new RepositoryError("Failed to list monthly plans", "listMonthlyPlans", err);
    }
  }

  async getMonthlyBalance(userId: string, monthYear: string): Promise<MonthlyBalance | null> {
    try {
      const { data, error } = await this.supabase
        .from("monthly_balances")
        .select("*")
        .eq("user_id", userId)
        .eq("month_year", monthYear)
        .maybeSingle();
      if (error) throw error;
      return data ? toBalance(data as BalanceRow) : null;
    } catch (err) {
      throw new RepositoryError("Failed to get monthly balance", "getMonthlyBalance", err);
    }
  }
}
