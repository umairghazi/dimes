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
        p: 1.75,
        borderRadius: 1,
        borderColor: "rgba(255,255,255,0.08)",
        bgcolor: "rgba(32,35,45,0.92)",
        minHeight: 88,
        boxShadow: "0 18px 40px rgba(0,0,0,0.24)",
      }}
    >
      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800 }}>{label}</Typography>
      <Typography
        variant="h5"
        sx={{
          mt: 0.75,
          fontWeight: 900,
          color: tone === "good" ? "success.main" : tone === "bad" ? "primary.main" : "text.primary",
        }}
      >
        {value}
      </Typography>
    </Paper>
  );
}

function LedgerStatSkeleton({ label }: { label: string }) {
  return (
    <Paper
      variant="outlined"
      sx={{
        p: 1.75,
        borderRadius: 1,
        borderColor: "rgba(255,255,255,0.08)",
        bgcolor: "rgba(32,35,45,0.92)",
        minHeight: 88,
      }}
    >
      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800 }}>{label}</Typography>
      <Skeleton width="68%" height={32} sx={{ mt: 0.75 }} />
    </Paper>
  );
}

function LedgerTableSkeleton({ title, height = 520 }: { title: string; height?: number }) {
  return (
    <Paper
      variant="outlined"
      sx={{
        overflow: "hidden",
        borderRadius: 1,
        borderColor: "rgba(255,255,255,0.08)",
        bgcolor: "rgba(32,35,45,0.94)",
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
      <Paper
        variant="outlined"
        sx={{
          p: { xs: 2, md: 3 },
          mb: 2,
          borderRadius: 1,
          borderColor: "rgba(255,255,255,0.08)",
          bgcolor: "#171a23",
          backgroundImage: "linear-gradient(135deg, rgba(88,101,242,0.16), rgba(255,107,44,0.12) 44%, rgba(255,255,255,0.03))",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 2, flexWrap: "wrap" }}>
          <Box>
            <Typography variant="overline" color="primary.main" sx={{ fontWeight: 900 }}>Transactions</Typography>
            <Typography variant="h1" sx={{ fontWeight: 900 }}>Ledger</Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mt: 1, maxWidth: 620 }}>
              Fast entry for expenses and income, with inline edits, bulk category cleanup, and paste support.
            </Typography>
          </Box>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 0.5,
              px: 1,
              py: 0.5,
              border: "1px solid",
              borderColor: "rgba(255,255,255,0.1)",
              borderRadius: 1,
              bgcolor: "rgba(15,17,23,0.48)",
            }}
          >
            <IconButton size="small" onClick={prevMonth}>
              <ChevronLeftIcon />
            </IconButton>
            <Typography variant="subtitle1" sx={{ fontWeight: 760, minWidth: 150, textAlign: "center" }}>
              {formatMonthLabel(month)}
            </Typography>
            <IconButton size="small" onClick={nextMonth} disabled={isCurrentMonth}>
              <ChevronRightIcon />
            </IconButton>
          </Box>
        </Box>
      </Paper>

      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid size={{ xs: 12, md: 3 }}>
          {expensesQuery.isLoading ? <LedgerStatSkeleton label="Expenses" /> : <LedgerStat label="Expenses" value={currency(totalExpenses)} tone="bad" />}
        </Grid>
        <Grid size={{ xs: 12, md: 3 }}>
          {incomeQuery.isLoading ? <LedgerStatSkeleton label="Income" /> : <LedgerStat label="Income" value={currency(totalIncome)} tone="good" />}
        </Grid>
        <Grid size={{ xs: 12, md: 3 }}>
          {expensesQuery.isLoading || incomeQuery.isLoading ? <LedgerStatSkeleton label="Net" /> : <LedgerStat label="Net" value={currency(net)} tone={net >= 0 ? "good" : "bad"} />}
        </Grid>
        <Grid size={{ xs: 12, md: 3 }}>
          {expensesQuery.isLoading || incomeQuery.isLoading ? <LedgerStatSkeleton label="Rows" /> : <LedgerStat label="Rows" value={`${expenseRows.length + incomeRows.length}`} />}
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
              onCreate={async (draft) => { await createMutation.mutateAsync({ ...draft, currency: "USD", source: "manual", isRecurring: false, tags: [] }); }}
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
              onCreate={async (draft) => { await createMutation.mutateAsync({ ...draft, currency: "USD", source: "manual", isRecurring: false, tags: [] }); }}
              onUpdate={async (id, patch) => { await updateMutation.mutateAsync({ id, patch }); }}
              onDelete={async (id) => { await deleteMutation.mutateAsync(id); }}
            />
          )}
        </Grid>
      </Grid>
    </Box>
  );
}
