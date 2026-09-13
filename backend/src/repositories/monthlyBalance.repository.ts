import { BaseRepository } from "./BaseRepository";
import { money, MonthlyBalance } from "../types/finance.types";

interface BalanceRow {
  id: string;
  user_id: string;
  month_year: string;
  starting_balance: string | number;
  ending_balance: string | number | null;
  currency: string;
}

export interface UpsertMonthlyBalanceData {
  monthYear: string;
  startingBalance: number;
  endingBalance?: number | null;
  currency?: string;
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

export class MonthlyBalanceRepository extends BaseRepository {
  constructor() {
    super("monthly_balances");
  }

  async getByMonth(userId: string, monthYear: string): Promise<MonthlyBalance | null> {
    const row = await this.execute<BalanceRow | null>(
      "get monthly balance",
      this.table()
        .select("*")
        .eq("user_id", userId)
        .eq("month_year", monthYear)
        .maybeSingle(),
    );

    return row ? toBalance(row) : null;
  }

  async listByYear(userId: string, year: number): Promise<MonthlyBalance[]> {
    const rows = await this.execute<BalanceRow[]>(
      "list yearly balances",
      this.table()
        .select("*")
        .eq("user_id", userId)
        .gte("month_year", `${year}-01`)
        .lte("month_year", `${year}-12`)
        .order("month_year", { ascending: true }),
    );

    return (rows ?? []).map(toBalance);
  }

  async upsert(userId: string, data: UpsertMonthlyBalanceData): Promise<MonthlyBalance> {
    const row = await this.execute<BalanceRow>(
      "upsert monthly balance",
      this.table()
        .upsert({
          user_id: userId,
          month_year: data.monthYear,
          starting_balance: data.startingBalance,
          ending_balance: data.endingBalance ?? null,
          currency: data.currency ?? "CAD",
          updated_at: new Date().toISOString(),
        }, { onConflict: "user_id,month_year" })
        .select("*")
        .single(),
    );

    return toBalance(row);
  }
}
