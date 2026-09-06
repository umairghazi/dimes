import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
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
  Typography,
} from "@mui/material";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { financeApi, MonthlyPlan } from "@/api/finance.api";
import { Expense } from "@/types/expense.types";
import { useMonthStore, isCurrentMonthYear } from "@/store/monthStore";

interface SummaryRow {
  category: string;
  planned: number;
  actual: number;
  diff: number;
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

function total(rows: Expense[], type: "expense" | "income"): number {
  return rows.filter((row) => row.type === type).reduce((sum, row) => sum + row.amount, 0);
}

function actualsByCategory(rows: Expense[], type: "expense" | "income"): Map<string, number> {
  const actuals = new Map<string, number>();
  rows.filter((row) => row.type === type).forEach((row) => {
    actuals.set(row.category, (actuals.get(row.category) ?? 0) + row.amount);
  });
  return actuals;
}

function buildRows(transactions: Expense[], plans: MonthlyPlan[], type: "expense" | "income"): SummaryRow[] {
  const actuals = actualsByCategory(transactions, type);
  const planned = plans.filter((plan) => plan.type === type);
  const names = new Set([...actuals.keys(), ...planned.map((plan) => plan.categoryName)]);

  return [...names]
    .sort((a, b) => a.localeCompare(b))
    .map((category) => {
      const plannedAmount = planned
        .filter((plan) => plan.categoryName === category)
        .reduce((sum, plan) => sum + plan.plannedAmount, 0);
      const actual = actuals.get(category) ?? 0;
      return {
        category,
        planned: plannedAmount,
        actual,
        diff: type === "expense" ? plannedAmount - actual : actual - plannedAmount,
      };
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

function Metric({ label, value, helper }: { label: string; value: string; helper?: string }) {
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

function BudgetTable({ title, rows, type }: { title: string; rows: SummaryRow[]; type: "expense" | "income" }) {
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
                <TableCell align="right">{currency(row.planned)}</TableCell>
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
  const { month, prevMonth, nextMonth } = useMonthStore();
  const isCurrentMonth = isCurrentMonthYear(month);

  const summaryQuery = useQuery({
    queryKey: ["finance", "summary", month],
    queryFn: () => financeApi.summary(month),
  });

  const transactions = summaryQuery.data?.transactions ?? [];
  const plans = summaryQuery.data?.plans ?? [];
  const expenseRows = useMemo(() => buildRows(transactions, plans, "expense"), [transactions, plans]);
  const incomeRows = useMemo(() => buildRows(transactions, plans, "income"), [transactions, plans]);
  const totalSpend = total(transactions, "expense");
  const totalIncome = total(transactions, "income");
  const netSavings = totalIncome - totalSpend;
  const startingBalance = summaryQuery.data?.balance?.startingBalance ?? 0;
  const endingBalance = summaryQuery.data?.balance?.endingBalance ?? startingBalance + netSavings;
  const plannedSpend = expenseRows.reduce((sum, row) => sum + row.planned, 0);
  const spendRatio = plannedSpend > 0 ? Math.min(100, (totalSpend / plannedSpend) * 100) : 0;

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

      {summaryQuery.isError && <Alert severity="error" sx={{ mb: 2 }}>Failed to load monthly summary</Alert>}

      {summaryQuery.isLoading ? (
        <Skeleton variant="rectangular" height={640} sx={{ borderRadius: 1 }} />
      ) : (
        <>
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid size={{ xs: 12, md: 3 }}>
              <Metric label="Starting Balance" value={currency(startingBalance)} />
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <Metric label="Ending Balance" value={currency(endingBalance)} />
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <Metric label="Income" value={currency(totalIncome)} helper={`${incomeRows.length} categories`} />
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <Metric label="Expenses" value={currency(totalSpend)} helper={`${transactions.length} rows loaded`} />
            </Grid>
          </Grid>

          <Paper variant="outlined" sx={{ p: 2, borderRadius: 1, mb: 2 }}>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>Expense Pace</Typography>
              <Typography variant="body2" color="text.secondary">
                {currency(totalSpend)} of {currency(plannedSpend)}
              </Typography>
            </Box>
            <LinearProgress variant="determinate" value={spendRatio} />
            <Typography variant="body2" sx={{ mt: 1, fontWeight: 700 }}>
              Savings: {currency(netSavings)}
            </Typography>
          </Paper>

          <Grid container spacing={2}>
            <Grid size={{ xs: 12, lg: 7 }}>
              <BudgetTable title="Expenses" rows={expenseRows} type="expense" />
            </Grid>
            <Grid size={{ xs: 12, lg: 5 }}>
              <BudgetTable title="Income" rows={incomeRows} type="income" />
            </Grid>
          </Grid>
        </>
      )}
    </Box>
  );
}
