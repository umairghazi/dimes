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
  async getByMonth(userId: string, monthYear: string): Promise<MonthlyBalance | null> {
    const row = await this.queryOne<BalanceRow>(
      "get monthly balance",
      `
      select
        id,
        user_id,
        month_year,
        starting_balance,
        ending_balance,
        currency
      from public.monthly_balances
      where user_id = $1
        and month_year = $2
      limit 1
      `,
      [userId, monthYear],
    );

    return row ? toBalance(row) : null;
  }
}
