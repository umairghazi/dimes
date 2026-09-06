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
