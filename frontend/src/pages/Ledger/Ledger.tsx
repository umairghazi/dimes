import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Alert,
  Box,
  Grid,
  IconButton,
  Paper,
  Skeleton,
  Typography,
} from "@mui/material";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { financeApi } from "@/api/finance.api";
import { useMonthStore, isCurrentMonthYear } from "@/store/monthStore";
import { Expense } from "@/types/expense.types";
import { LedgerTable } from "@/components/ledger/LedgerTable";

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

function sortOldestFirst(rows: Expense[]): Expense[] {
  return [...rows].sort((a, b) => {
    const date = new Date(a.date).getTime() - new Date(b.date).getTime();
    if (date !== 0) return date;
    return a.description.localeCompare(b.description);
  });
}

function currency(value: number): string {
  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

function total(rows: Expense[]): number {
  return rows.reduce((sum, row) => sum + row.amount, 0);
}

function LedgerStat({ label, value, tone }: { label: string; value: string; tone?: "good" | "bad" }) {
  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2,
        borderRadius: 1,
        bgcolor: (theme) => theme.palette.mode === "dark" ? "rgba(23,26,32,0.86)" : "rgba(255,255,255,0.82)",
        backdropFilter: "blur(18px)",
        minHeight: 96,
      }}
    >
      <Typography variant="caption" color="text.secondary">{label}</Typography>
      <Typography
        variant="h4"
        sx={{
          mt: 0.75,
          fontWeight: 850,
          color: tone === "good" ? "success.main" : tone === "bad" ? "primary.main" : "text.primary",
        }}
      >
        {value}
      </Typography>
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

  const loading = expensesQuery.isLoading || incomeQuery.isLoading || categoriesQuery.isLoading;
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
    <Box sx={{ p: { xs: 2, md: 3 }, width: "100%", minWidth: 0 }}>
      <Paper
        variant="outlined"
        sx={{
          p: { xs: 2, md: 3 },
          mb: 2,
          borderRadius: 1,
          bgcolor: (theme) => theme.palette.mode === "dark" ? "#12100d" : "#12100d",
          color: "#f7f2ea",
          boxShadow: "0 24px 70px rgba(18,16,13,0.16)",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 2, flexWrap: "wrap" }}>
          <Box>
            <Typography variant="overline" sx={{ color: "#ff875c", fontWeight: 850 }}>Transactions</Typography>
            <Typography variant="h1" sx={{ fontWeight: 850 }}>Ledger</Typography>
            <Typography variant="body1" sx={{ mt: 1, color: "rgba(247,242,234,0.68)", maxWidth: 620 }}>
              Fast spreadsheet entry with category cleanup and monthly totals in sight.
            </Typography>
          </Box>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 0.5,
              px: 1,
              py: 0.5,
              border: "1px solid rgba(247,242,234,0.18)",
              borderRadius: 1,
              bgcolor: "rgba(255,255,255,0.06)",
            }}
          >
            <IconButton size="small" onClick={prevMonth} sx={{ color: "#f7f2ea" }}>
              <ChevronLeftIcon />
            </IconButton>
            <Typography variant="subtitle1" sx={{ fontWeight: 760, minWidth: 150, textAlign: "center" }}>
              {formatMonthLabel(month)}
            </Typography>
            <IconButton size="small" onClick={nextMonth} disabled={isCurrentMonth} sx={{ color: "#f7f2ea" }}>
              <ChevronRightIcon />
            </IconButton>
          </Box>
        </Box>
      </Paper>

      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid size={{ xs: 12, md: 3 }}>
          <LedgerStat label="Expenses" value={currency(totalExpenses)} tone="bad" />
        </Grid>
        <Grid size={{ xs: 12, md: 3 }}>
          <LedgerStat label="Income" value={currency(totalIncome)} tone="good" />
        </Grid>
        <Grid size={{ xs: 12, md: 3 }}>
          <LedgerStat label="Net" value={currency(net)} tone={net >= 0 ? "good" : "bad"} />
        </Grid>
        <Grid size={{ xs: 12, md: 3 }}>
          <LedgerStat label="Rows" value={`${expenseRows.length + incomeRows.length}`} />
        </Grid>
      </Grid>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {loading ? (
        <Grid container spacing={2} sx={{ alignItems: "flex-start" }}>
          <Grid size={{ xs: 12, xl: 7 }}>
            <Skeleton variant="rectangular" height={520} sx={{ borderRadius: 1 }} />
          </Grid>
          <Grid size={{ xs: 12, xl: 5 }}>
            <Skeleton variant="rectangular" height={520} sx={{ borderRadius: 1 }} />
          </Grid>
        </Grid>
      ) : (
        <Grid container spacing={2} sx={{ alignItems: "flex-start" }}>
          <Grid size={{ xs: 12, xl: 7 }}>
            <LedgerTable
              title="Expenses"
              kind="expense"
              rows={expenseRows}
              categories={categories}
              defaultDate={range.defaultDate}
              onCreate={async (draft) => { await createMutation.mutateAsync({ ...draft, currency: "USD", source: "manual", isRecurring: false, tags: [] }); }}
              onUpdate={async (id, patch) => { await updateMutation.mutateAsync({ id, patch }); }}
              onDelete={async (id) => { await deleteMutation.mutateAsync(id); }}
            />
          </Grid>
          <Grid size={{ xs: 12, xl: 5 }}>
            <LedgerTable
              title="Income"
              kind="income"
              rows={incomeRows}
              categories={categories}
              defaultDate={range.defaultDate}
              onCreate={async (draft) => { await createMutation.mutateAsync({ ...draft, currency: "USD", source: "manual", isRecurring: false, tags: [] }); }}
              onUpdate={async (id, patch) => { await updateMutation.mutateAsync({ id, patch }); }}
              onDelete={async (id) => { await deleteMutation.mutateAsync(id); }}
            />
          </Grid>
        </Grid>
      )}
    </Box>
  );
}
