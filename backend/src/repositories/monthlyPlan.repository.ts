import { BaseRepository } from "./BaseRepository";
import { FinanceTransactionType, money, MonthlyPlan } from "../types/finance.types";

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
  constructor() {
    super("monthly_plans");
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
}
