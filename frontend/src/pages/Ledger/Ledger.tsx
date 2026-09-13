import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Alert,
  Box,
  Grid,
  Paper,
  Skeleton,
  Typography,
} from "@mui/material";
import { financeApi } from "@/api/finance.api";
import { useMonthStore, isCurrentMonthYear } from "@/store/monthStore";
import { Expense } from "@/types/expense.types";
import { LedgerTable } from "@/components/ledger/LedgerTable";
import { formatMonthLabel, currency } from "@/components/finance/financeFormat";
import { PageHero } from "@/components/finance/PageHero";
import { MonthSwitcher } from "@/components/finance/MonthSwitcher";
import { MetricCard, MetricCardSkeleton } from "@/components/finance/MetricCard";
import { financeSurfaces } from "@/components/finance/financeStyles";

function monthRange(monthYear: string): { defaultDate: string } {
  const [year, month] = monthYear.split("-").map(Number);
  const end = new Date(year, month, 0);
  const pad = (value: number) => String(value).padStart(2, "0");
  return {
    defaultDate: `${year}-${pad(month)}-${pad(Math.min(new Date().getDate(), end.getDate()))}`,
  };
}

function sortOldestFirst(rows: Expense[]): Expense[] {
  return [...rows].sort((a, b) => {
    const date = new Date(a.date).getTime() - new Date(b.date).getTime();
    if (date !== 0) return date;
    return a.description.localeCompare(b.description);
  });
}

function total(rows: Expense[]): number {
  return rows.reduce((sum, row) => sum + row.amount, 0);
}

function LedgerTableSkeleton({ title, height = 520 }: { title: string; height?: number }) {
  return (
    <Paper
      variant="outlined"
      sx={{
        ...financeSurfaces.panelMuted,
        overflow: "hidden",
      }}
    >
      <Box sx={{ px: 1.5, py: 1.25, borderBottom: "1px solid", borderColor: "rgba(255,255,255,0.08)", bgcolor: "rgba(15,17,23,0.36)" }}>
        <Typography variant="h5" sx={{ fontWeight: 900 }}>{title}</Typography>
        <Skeleton width={170} height={18} sx={{ mt: 0.35 }} />
      </Box>
      <Box sx={{ p: 1.5, display: "grid", gap: 1, minHeight: height - 72 }}>
        {[0, 1, 2, 3, 4, 5, 6, 7].map((row) => (
          <Box key={row} sx={{ display: "grid", gridTemplateColumns: "34px 150px 1fr 110px 220px", gap: 1, alignItems: "center" }}>
            <Skeleton height={24} />
            <Skeleton height={24} />
            <Skeleton height={24} />
            <Skeleton height={24} />
            <Skeleton height={24} />
          </Box>
        ))}
      </Box>
    </Paper>
  );
}

export function Ledger() {
  const queryClient = useQueryClient();
  const { month, prevMonth, nextMonth } = useMonthStore();
  const isCurrentMonth = isCurrentMonthYear(month);
  const range = useMemo(() => monthRange(month), [month]);

  const categoriesQuery = useQuery({
    queryKey: ["finance", "categories"],
    queryFn: () => financeApi.categories(),
  });

  const expensesQuery = useQuery({
    queryKey: ["finance", "transactions", "expense", month],
    queryFn: () => financeApi.transactions({ type: "expense", month }),
  });

  const incomeQuery = useQuery({
    queryKey: ["finance", "transactions", "income", month],
    queryFn: () => financeApi.transactions({ type: "income", month }),
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["finance"] });
  };

  const createMutation = useMutation({
    mutationFn: financeApi.createTransaction,
    onSuccess: invalidate,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<Expense> & { categoryId?: string | null } }) =>
      financeApi.updateTransaction(id, patch),
    onSuccess: invalidate,
  });

  const deleteMutation = useMutation({
    mutationFn: financeApi.deleteTransaction,
    onSuccess: invalidate,
  });

  const error = categoriesQuery.isError || expensesQuery.isError || incomeQuery.isError
    ? "Failed to load ledger"
    : null;

  const expenseRows = sortOldestFirst(expensesQuery.data?.data ?? []);
  const incomeRows = sortOldestFirst(incomeQuery.data?.data ?? []);
  const categories = categoriesQuery.data ?? [];
  const totalExpenses = total(expenseRows);
  const totalIncome = total(incomeRows);
  const net = totalIncome - totalExpenses;

  return (
    <Box sx={{ width: "100%", minWidth: 0 }}>
      <PageHero
        eyebrow="Transactions"
        title="Ledger"
        description="Fast entry for expenses and income, with inline edits, bulk category cleanup, and paste support."
        actions={(
          <MonthSwitcher
            label={formatMonthLabel(month)}
            onPrevious={prevMonth}
            onNext={nextMonth}
            nextDisabled={isCurrentMonth}
          />
        )}
      />

      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid size={{ xs: 12, md: 3 }}>
          {expensesQuery.isLoading ? <MetricCardSkeleton label="Expenses" /> : <MetricCard label="Expenses" value={currency(totalExpenses)} tone="bad" />}
        </Grid>
        <Grid size={{ xs: 12, md: 3 }}>
          {incomeQuery.isLoading ? <MetricCardSkeleton label="Income" /> : <MetricCard label="Income" value={currency(totalIncome)} tone="good" />}
        </Grid>
        <Grid size={{ xs: 12, md: 3 }}>
          {expensesQuery.isLoading || incomeQuery.isLoading ? <MetricCardSkeleton label="Net" /> : <MetricCard label="Net" value={currency(net)} tone={net >= 0 ? "good" : "bad"} />}
        </Grid>
        <Grid size={{ xs: 12, md: 3 }}>
          {expensesQuery.isLoading || incomeQuery.isLoading ? <MetricCardSkeleton label="Rows" /> : <MetricCard label="Rows" value={`${expenseRows.length + incomeRows.length}`} />}
        </Grid>
      </Grid>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Grid container spacing={2} sx={{ alignItems: "flex-start" }}>
        <Grid size={{ xs: 12, xl: 7 }}>
          {expensesQuery.isLoading || categoriesQuery.isLoading ? (
            <LedgerTableSkeleton title="Expenses" />
          ) : (
            <LedgerTable
              title="Expenses"
              kind="expense"
              rows={expenseRows}
              categories={categories}
              defaultDate={range.defaultDate}
              onCreate={async (draft) => { await createMutation.mutateAsync({ ...draft, monthYear: month, currency: "USD", source: "manual", isRecurring: false, tags: [] }); }}
              onUpdate={async (id, patch) => { await updateMutation.mutateAsync({ id, patch }); }}
              onDelete={async (id) => { await deleteMutation.mutateAsync(id); }}
            />
          )}
        </Grid>
        <Grid size={{ xs: 12, xl: 5 }}>
          {incomeQuery.isLoading || categoriesQuery.isLoading ? (
            <LedgerTableSkeleton title="Income" />
          ) : (
            <LedgerTable
              title="Income"
              kind="income"
              rows={incomeRows}
              categories={categories}
              defaultDate={range.defaultDate}
              onCreate={async (draft) => { await createMutation.mutateAsync({ ...draft, monthYear: month, currency: "USD", source: "manual", isRecurring: false, tags: [] }); }}
              onUpdate={async (id, patch) => { await updateMutation.mutateAsync({ id, patch }); }}
              onDelete={async (id) => { await deleteMutation.mutateAsync(id); }}
            />
          )}
        </Grid>
      </Grid>
    </Box>
  );
}
