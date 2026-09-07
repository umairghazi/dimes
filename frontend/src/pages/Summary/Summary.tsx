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

interface BreakdownRow {
  label: string;
  amount: number;
  percent: number;
}

const chartColors = ["#4285f4", "#db4437", "#f4b400", "#0f9d58", "#ff6d01", "#46bdc6", "#ab47bc", "#c6c91a", "#3949ab", "#f06292"];

function formatMonthLabel(monthYear: string): string {
  const [year, month] = monthYear.split("-").map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });
}

function formatShortDate(value: string): string {
  const date = new Date(`${value.slice(0, 10)}T00:00:00`);
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "2-digit" });
}

function currency(value: number): string {
  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

function currencyWithCents(value: number): string {
  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
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

function spendByDate(transactions: Expense[]): BreakdownRow[] {
  const grouped = new Map<string, number>();
  transactions.filter((row) => row.type === "expense").forEach((row) => {
    const key = row.date.slice(0, 10);
    grouped.set(key, (grouped.get(key) ?? 0) + row.amount);
  });
  const totalSpent = [...grouped.values()].reduce((sum, value) => sum + value, 0);
  return [...grouped.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([label, amount]) => ({ label, amount, percent: totalSpent > 0 ? (amount / totalSpent) * 100 : 0 }));
}

function expenseBreakdown(transactions: Expense[], field: "category" | "mainCategory"): BreakdownRow[] {
  const grouped = new Map<string, number>();
  transactions.filter((row) => row.type === "expense").forEach((row) => {
    const label = field === "category" ? row.category : row.mainCategory || row.category;
    grouped.set(label, (grouped.get(label) ?? 0) + row.amount);
  });
  const totalSpent = [...grouped.values()].reduce((sum, value) => sum + value, 0);
  return [...grouped.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([label, amount]) => ({ label, amount, percent: totalSpent > 0 ? (amount / totalSpent) * 100 : 0 }));
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

function SpendByDateChart({ rows }: { rows: BreakdownRow[] }) {
  const max = Math.max(...rows.map((row) => row.amount), 1);
  const width = 920;
  const height = 280;
  const left = 72;
  const right = 24;
  const top = 32;
  const bottom = 58;
  const plotWidth = width - left - right;
  const plotHeight = height - top - bottom;
  const step = rows.length > 1 ? plotWidth / (rows.length - 1) : plotWidth;
  const barWidth = Math.min(78, Math.max(32, plotWidth / Math.max(rows.length, 1) * 0.64));
  const points = rows.map((row, index) => {
    const x = rows.length > 1 ? left + index * step : left + plotWidth / 2;
    const y = top + plotHeight - (row.amount / max) * plotHeight;
    return `${x},${y}`;
  }).join(" ");
  const ticks = [0, 0.5, 1];

  return (
    <Paper variant="outlined" sx={{ borderRadius: 0, p: 2, overflowX: "auto" }}>
      <Typography variant="h5" sx={{ fontWeight: 800, color: "text.secondary", mb: 1 }}>Money spent by Date</Typography>
      {rows.length === 0 ? (
        <Typography color="text.secondary">No expenses for this month.</Typography>
      ) : (
        <Box component="svg" viewBox={`0 0 ${width} ${height}`} sx={{ width: "100%", minWidth: 760, display: "block" }}>
          {ticks.map((tick) => {
            const y = top + plotHeight - tick * plotHeight;
            return (
              <g key={tick}>
                <line x1={left} x2={width - right} y1={y} y2={y} stroke="#d0d0d0" />
                <text x={left - 10} y={y + 4} textAnchor="end" fontSize="12" fill="#777">{currencyWithCents(max * tick)}</text>
              </g>
            );
          })}
          <line x1={left} x2={width - right} y1={top + plotHeight} y2={top + plotHeight} stroke="#333" />
          {rows.map((row, index) => {
            const x = rows.length > 1 ? left + index * step : left + plotWidth / 2;
            const barHeight = (row.amount / max) * plotHeight;
            return (
              <g key={row.label}>
                <rect x={x - barWidth / 2} y={top + plotHeight - barHeight} width={barWidth} height={barHeight} fill="#4285f4" rx="2" />
                <text x={x} y={height - 28} textAnchor="middle" fontSize="12" fill="#777">{formatShortDate(row.label)}</text>
              </g>
            );
          })}
          <polyline points={points} fill="none" stroke="#ea4335" strokeWidth="2.5" />
          <text x={18} y={top + plotHeight / 2} transform={`rotate(-90 18 ${top + plotHeight / 2})`} textAnchor="middle" fontSize="13" fontWeight="700" fill="#444">Amount</text>
          <text x={left + plotWidth / 2} y={height - 4} textAnchor="middle" fontSize="13" fontWeight="700" fill="#444">Date</text>
        </Box>
      )}
    </Paper>
  );
}

function BreakdownChart({ title, rows }: { title: string; rows: BreakdownRow[] }) {
  let cursor = 0;
  const gradient = rows.length === 0
    ? "#e5e7eb"
    : rows.map((row, index) => {
      const start = cursor;
      cursor += row.percent;
      return `${chartColors[index % chartColors.length]} ${start}% ${cursor}%`;
    }).join(", ");

  return (
    <Paper variant="outlined" sx={{ borderRadius: 0, p: 2, height: "100%" }}>
      <Typography variant="h5" sx={{ fontWeight: 800, color: "text.secondary", mb: 2 }}>{title}</Typography>
      {rows.length === 0 ? (
        <Typography color="text.secondary">No expenses for this month.</Typography>
      ) : (
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "240px 1fr" }, gap: 2, alignItems: "center" }}>
          <Box
            sx={{
              width: 240,
              height: 240,
              borderRadius: "50%",
              background: `conic-gradient(${gradient})`,
              justifySelf: "center",
            }}
          />
          <Box sx={{ display: "grid", gap: 0.75 }}>
            {rows.slice(0, 10).map((row, index) => (
              <Box key={row.label} sx={{ display: "grid", gridTemplateColumns: "14px 1fr auto", gap: 1, alignItems: "center" }}>
                <Box sx={{ width: 10, height: 10, bgcolor: chartColors[index % chartColors.length] }} />
                <Typography variant="body2" sx={{ fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {row.label}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 700 }}>
                  {row.percent.toFixed(1)}%
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>
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
  const dailySpend = useMemo(() => spendByDate(transactions), [transactions]);
  const categorySpend = useMemo(() => expenseBreakdown(transactions, "category"), [transactions]);
  const mainCategorySpend = useMemo(() => expenseBreakdown(transactions, "mainCategory"), [transactions]);

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

          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid size={{ xs: 12 }}>
              <SpendByDateChart rows={dailySpend} />
            </Grid>
            <Grid size={{ xs: 12, lg: 6 }}>
              <BreakdownChart title="Percentage spent on Category" rows={categorySpend} />
            </Grid>
            <Grid size={{ xs: 12, lg: 6 }}>
              <BreakdownChart title="Percentage spent on Main Category" rows={mainCategorySpend} />
            </Grid>
          </Grid>

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
