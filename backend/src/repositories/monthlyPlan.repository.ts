import { BaseRepository } from "./BaseRepository";
import { FinanceCategoryType, money, MonthlyPlan } from "../types/finance.types";
import { SupabaseClient } from "@supabase/supabase-js";

interface PlanRow {
  id: string;
  user_id: string;
  month_year: string;
  category_id: string | null;
  category_name: string;
  type: FinanceCategoryType;
  planned_amount: string | number;
  currency: string;
  carry_forward: boolean;
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

export class MonthlyPlanRepository extends BaseRepository {
  constructor(db: SupabaseClient) {
    super("monthly_plans", db);
  }

  async listByMonth(userId: string, monthYear: string): Promise<MonthlyPlan[]> {
    const rows = await this.execute<PlanRow[]>(
      "list monthly plans",
      this.table()
        .select("*")
        .eq("user_id", userId)
        .eq("month_year", monthYear)
        .order("type", { ascending: true })
        .order("category_name", { ascending: true }),
    );

    return (rows ?? []).map(toPlan);
  }

  async upsert(userId: string, data: {
    monthYear: string;
    categoryId?: string | null;
    categoryName: string;
    type: FinanceCategoryType;
    plannedAmount: number;
    currency?: string;
    carryForward?: boolean;
  }): Promise<MonthlyPlan> {
    const row = await this.execute<PlanRow>(
      "upsert monthly plan",
      this.table()
        .upsert({
          user_id: userId,
          month_year: data.monthYear,
          category_id: data.categoryId ?? null,
          category_name: data.categoryName,
          type: data.type,
          planned_amount: data.plannedAmount,
          currency: data.currency ?? "CAD",
          carry_forward: data.carryForward ?? false,
          updated_at: new Date().toISOString(),
        }, { onConflict: "user_id,month_year,category_name,type" })
        .select("*")
        .single(),
    );

    return toPlan(row);
  }

  async delete(userId: string, id: string): Promise<void> {
    await this.executeEmpty(
      "delete monthly plan",
      this.table()
        .delete()
        .eq("user_id", userId)
        .eq("id", id),
    );
  }
}
