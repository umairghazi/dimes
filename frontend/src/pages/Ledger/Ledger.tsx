import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Alert,
  Box,
  Grid,
  IconButton,
  Skeleton,
  Typography,
} from "@mui/material";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { financeApi } from "@/api/finance.api";
import { useMonthStore, isCurrentMonthYear } from "@/store/monthStore";
import { FinanceTransaction } from "@/types/finance.types";
import { LedgerRow, LedgerTable } from "@/components/ledger/LedgerTable";

function formatMonthLabel(monthYear: string): string {
  const [year, month] = monthYear.split("-").map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });
}

function monthRange(monthYear: string): { defaultDate: string } {
  const [year, month] = monthYear.split("-").map(Number);
  const end = new Date(year, month, 0);
  const pad = (value: number) => String(value).padStart(2, "0");
  return {
    defaultDate: `${year}-${pad(month)}-${pad(Math.min(new Date().getDate(), end.getDate()))}`,
  };
}

function sortOldestFirst<T extends { date: string; description: string }>(rows: T[]): T[] {
  return [...rows].sort((a, b) => {
    const date = new Date(a.date).getTime() - new Date(b.date).getTime();
    if (date !== 0) return date;
    return a.description.localeCompare(b.description);
  });
}

function financeToLedgerRow(row: FinanceTransaction): LedgerRow {
  return {
    id: row.id,
    date: row.date,
    description: row.description,
    amount: row.amount,
    category: row.category,
    type: row.type,
  };
}

export function Ledger() {
  const { month, prevMonth, nextMonth } = useMonthStore();
  const isCurrentMonth = isCurrentMonthYear(month);
  const range = useMemo(() => monthRange(month), [month]);

  const financeStatusQuery = useQuery({
    queryKey: ["finance", "status"],
    queryFn: financeApi.status,
  });

  const financeExpensesQuery = useQuery({
    queryKey: ["finance", "transactions", "expense", month],
    queryFn: () => financeApi.transactions({ type: "expense", month }),
  });

  const financeIncomeQuery = useQuery({
    queryKey: ["finance", "transactions", "income", month],
    queryFn: () => financeApi.transactions({ type: "income", month }),
  });

  const loading =
    financeStatusQuery.isLoading ||
    financeExpensesQuery.isLoading ||
    financeIncomeQuery.isLoading;
  const error =
    financeStatusQuery.isError ||
    financeExpensesQuery.isError ||
    financeIncomeQuery.isError ||
    financeStatusQuery.data?.configured === false
    ? "Failed to load ledger"
    : null;

  const expenseRows = sortOldestFirst(
    (financeExpensesQuery.data?.data ?? []).map(financeToLedgerRow),
  );
  const incomeRows = sortOldestFirst(
    (financeIncomeQuery.data?.data ?? []).map(financeToLedgerRow),
  );

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1440, mx: "auto" }}>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800 }}>Ledger</Typography>
          <Typography variant="body2" color="text.secondary">
            Private Google Sheets data, shown read-only until Sheets write-back lands.
          </Typography>
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
          <IconButton size="small" onClick={prevMonth}>
            <ChevronLeftIcon />
          </IconButton>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, minWidth: 150, textAlign: "center" }}>
            {formatMonthLabel(month)}
          </Typography>
          <IconButton size="small" onClick={nextMonth} disabled={isCurrentMonth}>
            <ChevronRightIcon />
          </IconButton>
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {loading ? (
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, lg: 7 }}>
            <Skeleton variant="rectangular" height={520} sx={{ borderRadius: 1 }} />
          </Grid>
          <Grid size={{ xs: 12, lg: 5 }}>
            <Skeleton variant="rectangular" height={520} sx={{ borderRadius: 1 }} />
          </Grid>
        </Grid>
      ) : (
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, lg: 7 }}>
            <LedgerTable
              title="Expenses"
              kind="expense"
              rows={expenseRows}
              categories={[]}
              defaultDate={range.defaultDate}
              readOnly
              onCreate={async () => {}}
              onUpdate={async () => {}}
              onDelete={async () => {}}
            />
          </Grid>
          <Grid size={{ xs: 12, lg: 5 }}>
            <LedgerTable
              title="Income"
              kind="income"
              rows={incomeRows}
              categories={[]}
              defaultDate={range.defaultDate}
              readOnly
              onCreate={async () => {}}
              onUpdate={async () => {}}
              onDelete={async () => {}}
            />
          </Grid>
        </Grid>
      )}
    </Box>
  );
}
