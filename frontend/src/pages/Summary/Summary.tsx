import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Alert,
  Box,
  Grid,
  IconButton,
  LinearProgress,
  Paper,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { analyticsApi } from "@/api/analytics.api";
import { balanceApi, MonthlyBalanceSummary } from "@/api/balance.api";
import { budgetsApi } from "@/api/budgets.api";
import { useAnalyticsStore, isCurrentMonthYear } from "@/store/analyticsStore";
import { useCategories } from "@/hooks/useCategories";
import { Budget } from "@/types/budget.types";
import { UserCategory } from "@/types/category.types";

interface SummaryRow {
  category: string;
  planned: number;
  actual: number;
  diff: number;
  budget?: Budget;
}

function formatMonthLabel(monthYear: string): string {
  const [year, month] = monthYear.split("-").map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });
}

function currency(value: number): string {
  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

function moneyInput(value: number): string {
  return Number.isFinite(value) ? value.toFixed(2) : "0.00";
}

function buildRows(
  categories: UserCategory[],
  budgets: Budget[],
  actuals: Map<string, number>,
  type: "expense" | "income",
): SummaryRow[] {
  const relevantCategories = categories.filter((c) => (c.type ?? "expense") === type);
  const budgetMap = new Map(budgets.map((b) => [b.category, b]));
  const names = new Set<string>([
    ...relevantCategories.map((c) => c.name),
    ...budgets.map((b) => b.category),
    ...actuals.keys(),
  ]);

  return [...names]
    .sort((a, b) => a.localeCompare(b))
    .map((category) => {
      const budget = budgetMap.get(category);
      const planned = budget?.limitAmount ?? 0;
      const actual = actuals.get(category) ?? 0;
      const diff = type === "expense" ? planned - actual : actual - planned;
      return { category, planned, actual, diff, budget };
    });
}

function DiffText({ value }: { value: number }) {
  const color = value > 0 ? "success.main" : value < 0 ? "error.main" : "text.secondary";
  return (
    <Typography component="span" sx={{ color, fontWeight: 700 }}>
      {value > 0 ? "+" : ""}{currency(value)}
    </Typography>
  );
}

function SummaryMetric({
  label,
  value,
  helper,
}: {
  label: string;
  value: string;
  helper?: string;
}) {
  return (
    <Paper variant="outlined" sx={{ p: 2, borderRadius: 1, height: "100%" }}>
      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: "uppercase" }}>
        {label}
      </Typography>
      <Typography variant="h4" sx={{ mt: 1, fontWeight: 800 }}>
        {value}
      </Typography>
      {helper && (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          {helper}
        </Typography>
      )}
    </Paper>
  );
}

function BalanceField({
  label,
  value,
  onSave,
}: {
  label: string;
  value: number | null;
  onSave: (value: number | null) => Promise<void>;
}) {
  const [draft, setDraft] = useState(value === null ? "" : moneyInput(value));

  const commit = async () => {
    if (draft.trim() === "") {
      await onSave(null);
      return;
    }
    const next = Number(draft);
    if (!Number.isFinite(next)) return;
    await onSave(next);
  };

  return (
    <TextField
      label={label}
      size="small"
      type="number"
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => void commit()}
      slotProps={{ htmlInput: { step: "0.01" } }}
    />
  );
}

function BudgetTable({
  title,
  rows,
  type,
  onSavePlanned,
}: {
  title: string;
  rows: SummaryRow[];
  type: "expense" | "income";
  onSavePlanned: (row: SummaryRow, value: number) => Promise<void>;
}) {
  const totals = rows.reduce(
    (sum, row) => ({
      planned: sum.planned + row.planned,
      actual: sum.actual + row.actual,
      diff: sum.diff + row.diff,
    }),
    { planned: 0, actual: 0, diff: 0 },
  );

  return (
    <Paper variant="outlined" sx={{ borderRadius: 1, overflow: "hidden" }}>
      <Box sx={{ px: 1.5, py: 1.25 }}>
        <Typography variant="h6" sx={{ fontWeight: 800, color: type === "expense" ? "error.main" : "success.main" }}>
          {title}
        </Typography>
      </Box>
      <TableContainer sx={{ maxHeight: "calc(100vh - 360px)" }}>
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow>
              <TableCell>Category</TableCell>
              <TableCell align="right" sx={{ width: 112 }}>Planned</TableCell>
              <TableCell align="right" sx={{ width: 112 }}>Actual</TableCell>
              <TableCell align="right" sx={{ width: 112 }}>Diff</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            <TableRow sx={{ bgcolor: "action.hover" }}>
              <TableCell sx={{ fontWeight: 800 }}>Totals</TableCell>
              <TableCell align="right" sx={{ fontWeight: 800 }}>{currency(totals.planned)}</TableCell>
              <TableCell align="right" sx={{ fontWeight: 800 }}>{currency(totals.actual)}</TableCell>
              <TableCell align="right"><DiffText value={totals.diff} /></TableCell>
            </TableRow>
            {rows.map((row) => (
              <TableRow key={row.category} hover>
                <TableCell sx={{ fontWeight: 600 }}>{row.category}</TableCell>
                <TableCell align="right">
                  <TextField
                    size="small"
                    variant="standard"
                    type="number"
                    defaultValue={moneyInput(row.planned)}
                    onBlur={(e) => {
                      const next = Number(e.target.value);
                      if (Number.isFinite(next) && next !== row.planned) {
                        void onSavePlanned(row, next);
                      }
                    }}
                    slotProps={{ htmlInput: { min: 0, step: "0.01", style: { textAlign: "right" } } }}
                  />
                </TableCell>
                <TableCell align="right">{currency(row.actual)}</TableCell>
                <TableCell align="right"><DiffText value={row.diff} /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
}

export function Summary() {
  const queryClient = useQueryClient();
  const { month, prevMonth, nextMonth } = useAnalyticsStore();
  const isCurrentMonth = isCurrentMonthYear(month);
  const { categories, loading: categoriesLoading, error: categoriesError } = useCategories();

  const summaryQuery = useQuery({
    queryKey: ["summary-page", "analytics", month],
    queryFn: () => analyticsApi.getSummary(month),
  });
  const incomeQuery = useQuery({
    queryKey: ["summary-page", "income", month],
    queryFn: () => analyticsApi.getIncomeBreakdown(month),
  });
  const budgetsQuery = useQuery({
    queryKey: ["summary-page", "budgets"],
    queryFn: budgetsApi.list,
  });
  const balanceQuery = useQuery({
    queryKey: ["summary-page", "balance", month],
    queryFn: () => balanceApi.get(month),
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["summary-page"] });
    queryClient.invalidateQueries({ queryKey: ["analytics"] });
    queryClient.invalidateQueries({ queryKey: ["budgets"] });
  };

  const budgetMutation = useMutation({
    mutationFn: async ({ row, value }: { row: SummaryRow; value: number }) => {
      if (row.budget) {
        return budgetsApi.update(row.budget.id, { limitAmount: Math.max(0, value) });
      }
      return budgetsApi.create({
        category: row.category,
        monthYear: month,
        limitAmount: Math.max(0, value),
        currency: balanceQuery.data?.currency ?? "USD",
      });
    },
    onSuccess: invalidate,
  });

  const balanceMutation = useMutation({
    mutationFn: (next: { startingBalance?: number; endingBalance?: number | null }) => {
      const current: MonthlyBalanceSummary | null = balanceQuery.data ?? null;
      return balanceApi.upsert({
        monthYear: month,
        startingBalance: next.startingBalance ?? current?.startingBalance ?? 0,
        endingBalance: next.endingBalance !== undefined ? next.endingBalance : current?.endingBalance ?? null,
        currency: current?.currency ?? "USD",
      });
    },
    onSuccess: invalidate,
  });

  const monthBudgets = (budgetsQuery.data ?? []).filter((b) => b.monthYear === month);
  const expenseActuals = useMemo(
    () => new Map((summaryQuery.data?.byCategory ?? []).map((row) => [row.category, row.amount])),
    [summaryQuery.data],
  );
  const incomeActuals = useMemo(
    () => new Map((incomeQuery.data?.rows ?? []).map((row) => [row.category, row.actual])),
    [incomeQuery.data],
  );
  const expenseBudgetNames = new Set(categories.filter((c) => (c.type ?? "expense") === "expense").map((c) => c.name));
  const incomeBudgetNames = new Set(categories.filter((c) => c.type === "income").map((c) => c.name));
  const expenseBudgets = monthBudgets.filter((b) => expenseBudgetNames.has(b.category) || expenseActuals.has(b.category));
  const incomeBudgets = monthBudgets.filter((b) => incomeBudgetNames.has(b.category) || incomeActuals.has(b.category));
  const expenseRows = buildRows(categories, expenseBudgets, expenseActuals, "expense");
  const incomeRows = buildRows(categories, incomeBudgets, incomeActuals, "income");

  const loading = summaryQuery.isLoading || incomeQuery.isLoading || budgetsQuery.isLoading || balanceQuery.isLoading || categoriesLoading;
  const error = categoriesError || summaryQuery.isError || incomeQuery.isError || budgetsQuery.isError || balanceQuery.isError
    ? "Failed to load monthly summary"
    : null;

  const balance = balanceQuery.data;
  const savingsRate = balance && balance.income > 0 ? (balance.savingsIncomeBased / balance.income) * 100 : 0;
  const plannedSpend = expenseRows.reduce((sum, row) => sum + row.planned, 0);
  const plannedIncome = incomeRows.reduce((sum, row) => sum + row.planned, 0);
  const spendRatio = plannedSpend > 0 ? Math.min(100, ((summaryQuery.data?.totalSpend ?? 0) / plannedSpend) * 100) : 0;
  const incomeRatio = plannedIncome > 0 ? Math.min(100, ((summaryQuery.data?.totalIncome ?? 0) / plannedIncome) * 100) : 0;

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1440, mx: "auto" }}>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800 }}>Monthly Summary</Typography>
          <Typography variant="body2" color="text.secondary">
            Planned vs actual, balances, and savings for the month.
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
        <Skeleton variant="rectangular" height={640} sx={{ borderRadius: 1 }} />
      ) : (
        <>
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid size={{ xs: 12, md: 3 }}>
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 1, height: "100%" }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: "uppercase" }}>
                  Balances
                </Typography>
                <Box sx={{ display: "flex", gap: 1.5, mt: 2, flexWrap: "wrap" }}>
                  <BalanceField
                    label="Starting"
                    value={balance?.startingBalance ?? 0}
                    onSave={async (value) => { await balanceMutation.mutateAsync({ startingBalance: value ?? 0 }); }}
                  />
                  <BalanceField
                    label="Ending"
                    value={balance?.endingBalance ?? null}
                    onSave={async (value) => { await balanceMutation.mutateAsync({ endingBalance: value }); }}
                  />
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
                  Computed ending: {currency(balance?.computedEndingBalance ?? 0)}
                </Typography>
              </Paper>
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <SummaryMetric
                label="Saved this month"
                value={currency(balance?.savingsIncomeBased ?? 0)}
                helper={`${savingsRate.toFixed(0)}% of income`}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <SummaryMetric
                label="Expense plan"
                value={`${spendRatio.toFixed(0)}%`}
                helper={`${currency(summaryQuery.data?.totalSpend ?? 0)} actual of ${currency(plannedSpend)} planned`}
              />
              <LinearProgress variant="determinate" value={spendRatio} sx={{ mt: -1, mx: 2 }} />
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <SummaryMetric
                label="Income plan"
                value={`${incomeRatio.toFixed(0)}%`}
                helper={`${currency(summaryQuery.data?.totalIncome ?? 0)} actual of ${currency(plannedIncome)} planned`}
              />
              <LinearProgress color="success" variant="determinate" value={incomeRatio} sx={{ mt: -1, mx: 2 }} />
            </Grid>
          </Grid>

          <Grid container spacing={2}>
            <Grid size={{ xs: 12, lg: 7 }}>
              <BudgetTable
                title="Expenses"
                rows={expenseRows}
                type="expense"
                onSavePlanned={async (row, value) => { await budgetMutation.mutateAsync({ row, value }); }}
              />
            </Grid>
            <Grid size={{ xs: 12, lg: 5 }}>
              <BudgetTable
                title="Income"
                rows={incomeRows}
                type="income"
                onSavePlanned={async (row, value) => { await budgetMutation.mutateAsync({ row, value }); }}
              />
            </Grid>
          </Grid>
        </>
      )}
    </Box>
  );
}
