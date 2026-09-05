import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
import { expensesApi } from "@/api/expenses.api";
import { useCategories } from "@/hooks/useCategories";
import { useAnalyticsStore, isCurrentMonthYear } from "@/store/analyticsStore";
import { Expense } from "@/types/expense.types";
import { LedgerTable } from "@/components/ledger/LedgerTable";

function formatMonthLabel(monthYear: string): string {
  const [year, month] = monthYear.split("-").map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });
}

function monthRange(monthYear: string): { dateFrom: string; dateTo: string; defaultDate: string } {
  const [year, month] = monthYear.split("-").map(Number);
  const end = new Date(year, month, 0);
  const pad = (value: number) => String(value).padStart(2, "0");
  return {
    dateFrom: `${year}-${pad(month)}-01`,
    dateTo: `${end.getFullYear()}-${pad(end.getMonth() + 1)}-${pad(end.getDate())}`,
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

export function Ledger() {
  const queryClient = useQueryClient();
  const { month, prevMonth, nextMonth } = useAnalyticsStore();
  const isCurrentMonth = isCurrentMonthYear(month);
  const { categories, loading: categoriesLoading, error: categoriesError } = useCategories();
  const range = useMemo(() => monthRange(month), [month]);

  const expensesQuery = useQuery({
    queryKey: ["ledger", "expense", month],
    queryFn: () => expensesApi.list({ type: "expense", dateFrom: range.dateFrom, dateTo: range.dateTo, page: 1, limit: 250 }),
  });

  const incomeQuery = useQuery({
    queryKey: ["ledger", "income", month],
    queryFn: () => expensesApi.list({ type: "income", dateFrom: range.dateFrom, dateTo: range.dateTo, page: 1, limit: 250 }),
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["ledger"] });
    queryClient.invalidateQueries({ queryKey: ["expenses"] });
    queryClient.invalidateQueries({ queryKey: ["analytics"] });
  };

  const createMutation = useMutation({
    mutationFn: expensesApi.create,
    onSuccess: invalidate,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<Expense> & { categoryId?: string | null } }) =>
      expensesApi.update(id, patch),
    onSuccess: invalidate,
  });

  const deleteMutation = useMutation({
    mutationFn: expensesApi.delete,
    onSuccess: invalidate,
  });

  const loading = expensesQuery.isLoading || incomeQuery.isLoading || categoriesLoading;
  const error = categoriesError || expensesQuery.isError || incomeQuery.isError
    ? "Failed to load ledger"
    : null;

  const expenseRows = sortOldestFirst(expensesQuery.data?.data ?? []);
  const incomeRows = sortOldestFirst(incomeQuery.data?.data ?? []);

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1440, mx: "auto" }}>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800 }}>Ledger</Typography>
          <Typography variant="body2" color="text.secondary">
            Fast monthly entry for expenses and income.
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
              categories={categories}
              defaultDate={range.defaultDate}
              onCreate={async (draft) => { await createMutation.mutateAsync({ ...draft, currency: "USD", source: "manual", isRecurring: false, tags: [] }); }}
              onUpdate={async (id, patch) => { await updateMutation.mutateAsync({ id, patch }); }}
              onDelete={async (id) => { await deleteMutation.mutateAsync(id); }}
            />
          </Grid>
          <Grid size={{ xs: 12, lg: 5 }}>
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
