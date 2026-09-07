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
  async listByMonth(userId: string, monthYear: string): Promise<MonthlyPlan[]> {
    const rows = await this.query<PlanRow>(
      "list monthly plans",
      `
      select
        id,
        user_id,
        month_year,
        category_id,
        category_name,
        type,
        planned_amount,
        currency,
        carry_forward
      from public.monthly_plans
      where user_id = $1
        and month_year = $2
      order by type asc, category_name asc
      `,
      [userId, monthYear],
    );

    return rows.map(toPlan);
  }
}
