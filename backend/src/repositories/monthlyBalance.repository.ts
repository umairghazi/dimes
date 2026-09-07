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
}
