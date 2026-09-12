import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Alert,
  Box,
  Grid,
  IconButton,
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

const chartColors = ["#ff6b2c", "#5865f2", "#29cc7a", "#f0b232", "#35c2ff", "#ff5c6c", "#8bdf7a", "#c084fc", "#f472b6", "#94a3b8"];

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
    <Paper
      variant="outlined"
      sx={{
        p: 2,
        borderRadius: 1,
        height: "100%",
        borderColor: "rgba(255,255,255,0.08)",
        bgcolor: "rgba(32,35,45,0.92)",
        boxShadow: "0 18px 40px rgba(0,0,0,0.24)",
      }}
    >
      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800 }}>
        {label}
      </Typography>
      <Typography variant="h4" sx={{ mt: 0.75, fontWeight: 900 }}>
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

function MetricSkeleton() {
  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2,
        borderRadius: 1,
        height: "100%",
        borderColor: "rgba(255,255,255,0.08)",
        bgcolor: "rgba(32,35,45,0.92)",
      }}
    >
      <Skeleton width={96} height={18} />
      <Skeleton width="68%" height={36} sx={{ mt: 0.75 }} />
      <Skeleton width="44%" height={18} sx={{ mt: 0.5 }} />
    </Paper>
  );
}

function SummaryHero({
  startingBalance,
  endingBalance,
  totalSpend,
  totalIncome,
  plannedSpend,
  netSavings,
}: {
  startingBalance: number;
  endingBalance: number;
  totalSpend: number;
  totalIncome: number;
  plannedSpend: number;
  netSavings: number;
}) {
  const savingsRate = startingBalance > 0 ? (netSavings / startingBalance) * 100 : 0;
  const spendRatio = plannedSpend > 0 ? Math.min(100, (totalSpend / plannedSpend) * 100) : 0;
  const maxBalance = Math.max(startingBalance, endingBalance, 1);

  return (
    <Paper
      variant="outlined"
      sx={{
        display: "grid",
        gridTemplateColumns: { xs: "1fr", lg: "1.1fr 0.9fr" },
        gap: { xs: 3, lg: 4 },
        p: { xs: 2, md: 3 },
        borderRadius: 1,
        borderColor: "rgba(255,255,255,0.08)",
        bgcolor: "#171a23",
        backgroundImage: "linear-gradient(135deg, rgba(255,107,44,0.2), rgba(88,101,242,0.14) 42%, rgba(255,255,255,0.03))",
        color: "#f7f8fc",
        overflow: "hidden",
        position: "relative",
        boxShadow: "0 24px 70px rgba(18,16,13,0.16)",
      }}
    >
      <Box>
        <Typography variant="overline" sx={{ color: "#ff875c", fontWeight: 900 }}>Monthly position</Typography>
        <Typography variant="h2" sx={{ mt: 1, maxWidth: 720 }}>
          {netSavings >= 0 ? "Cash flow is positive." : "Cash flow is negative."}
        </Typography>
        <Typography variant="h1" sx={{ mt: 1.5, color: netSavings >= 0 ? "#77e0ac" : "#ff875c" }}>
          {currency(netSavings)}
        </Typography>
        <Typography variant="body1" sx={{ mt: 1, color: "rgba(247,242,234,0.7)", maxWidth: 560 }}>
          A compact view of spend, income, planned budgets, and the account movement behind the month.
        </Typography>

        <Box sx={{ mt: 3, display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr 1fr" }, gap: 1 }}>
          {[
            ["Income", currency(totalIncome), "#29cc7a"],
            ["Expenses", currency(totalSpend), "#ff9a64"],
            ["Planned spend", currency(plannedSpend), "#8ea0ff"],
          ].map(([label, value, color]) => (
            <Box key={label} sx={{ border: "1px solid rgba(255,255,255,0.1)", borderRadius: 1, p: 1.5, bgcolor: "rgba(15,17,23,0.48)" }}>
              <Typography variant="caption" sx={{ color: "rgba(247,242,234,0.58)" }}>{label}</Typography>
              <Typography variant="h5" sx={{ color, mt: 0.5 }}>{value}</Typography>
            </Box>
          ))}
        </Box>
      </Box>

      <Box sx={{ display: "grid", alignContent: "space-between", gap: 3 }}>
        <Box sx={{ border: "1px solid rgba(255,255,255,0.1)", borderRadius: 1, p: 2, bgcolor: "rgba(15,17,23,0.48)" }}>
          <Box sx={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 2 }}>
            <Typography variant="caption" sx={{ color: "rgba(247,242,234,0.58)" }}>Savings rate</Typography>
            <Typography variant="h3" sx={{ color: savingsRate >= 0 ? "#77e0ac" : "#ff875c" }}>
              {savingsRate > 0 ? "+" : ""}{savingsRate.toFixed(0)}%
            </Typography>
          </Box>
          <Box sx={{ mt: 2, height: 8, borderRadius: 999, bgcolor: "rgba(247,242,234,0.14)", overflow: "hidden" }}>
            <Box sx={{ width: `${spendRatio}%`, height: "100%", bgcolor: "#ff5a1f", borderRadius: 999 }} />
          </Box>
          <Typography variant="caption" sx={{ display: "block", mt: 1, color: "rgba(247,242,234,0.62)" }}>
            {currency(totalSpend)} spent of {currency(plannedSpend)} planned
          </Typography>
        </Box>

        <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2, minHeight: 240, alignItems: "end" }}>
          {[
            ["Start", startingBalance, "#8ea0ff"],
            ["End", endingBalance, endingBalance >= startingBalance ? "#29cc7a" : "#ff9a64"],
          ].map(([label, value, color]) => (
            <Box key={label} sx={{ display: "grid", alignItems: "end", justifyItems: "center", gap: 1.25 }}>
              <Box sx={{ width: "44%", minWidth: 54, height: `${Math.max(18, (Number(value) / maxBalance) * 180)}px`, bgcolor: color, borderRadius: "8px 8px 2px 2px" }} />
              <Box sx={{ textAlign: "center" }}>
                <Typography variant="caption" sx={{ color: "rgba(247,242,234,0.58)" }}>{label}</Typography>
                <Typography variant="h5">{currency(Number(value))}</Typography>
              </Box>
            </Box>
          ))}
        </Box>
      </Box>
    </Paper>
  );
}

function SummaryHeroSkeleton() {
  return (
    <Paper
      variant="outlined"
      sx={{
        display: "grid",
        gridTemplateColumns: { xs: "1fr", lg: "1.1fr 0.9fr" },
        gap: { xs: 3, lg: 4 },
        p: { xs: 2, md: 3 },
        borderRadius: 1,
        borderColor: "rgba(255,255,255,0.08)",
        bgcolor: "#171a23",
        minHeight: 360,
      }}
    >
      <Box>
        <Skeleton width={140} height={18} />
        <Skeleton width="76%" height={54} sx={{ mt: 1 }} />
        <Skeleton width={260} height={64} sx={{ mt: 1.5 }} />
        <Skeleton width="58%" height={22} sx={{ mt: 1 }} />
        <Box sx={{ mt: 3, display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr 1fr" }, gap: 1 }}>
          {[0, 1, 2].map((item) => (
            <Box key={item} sx={{ border: "1px solid rgba(255,255,255,0.1)", borderRadius: 1, p: 1.5, bgcolor: "rgba(15,17,23,0.48)" }}>
              <Skeleton width="50%" height={18} />
              <Skeleton width="72%" height={30} sx={{ mt: 0.5 }} />
            </Box>
          ))}
        </Box>
      </Box>
      <Box sx={{ display: "grid", alignContent: "space-between", gap: 3 }}>
        <Box sx={{ border: "1px solid rgba(255,255,255,0.1)", borderRadius: 1, p: 2, bgcolor: "rgba(15,17,23,0.48)" }}>
          <Skeleton width="40%" height={18} />
          <Skeleton width="36%" height={48} sx={{ mt: 1 }} />
          <Skeleton variant="rectangular" height={8} sx={{ mt: 2, borderRadius: 999 }} />
        </Box>
        <Skeleton variant="rectangular" height={220} sx={{ borderRadius: 1 }} />
      </Box>
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
    <Paper variant="outlined" sx={{ borderRadius: 1, p: 2, overflowX: "auto", borderColor: "rgba(255,255,255,0.08)", bgcolor: "rgba(32,35,45,0.92)" }}>
      <Typography variant="h5" sx={{ fontWeight: 900, color: "text.primary", mb: 1 }}>Money spent by date</Typography>
      {rows.length === 0 ? (
        <Typography color="text.secondary">No expenses for this month.</Typography>
      ) : (
        <Box component="svg" viewBox={`0 0 ${width} ${height}`} sx={{ width: "100%", minWidth: 760, display: "block" }}>
          {ticks.map((tick) => {
            const y = top + plotHeight - tick * plotHeight;
            return (
              <g key={tick}>
                <line x1={left} x2={width - right} y1={y} y2={y} stroke="currentColor" opacity="0.12" />
                <text x={left - 10} y={y + 4} textAnchor="end" fontSize="12" fill="#b5bbcb">{currencyWithCents(max * tick)}</text>
              </g>
            );
          })}
          <line x1={left} x2={width - right} y1={top + plotHeight} y2={top + plotHeight} stroke="#535b70" />
          {rows.map((row, index) => {
            const x = rows.length > 1 ? left + index * step : left + plotWidth / 2;
            const barHeight = (row.amount / max) * plotHeight;
            return (
              <g key={row.label}>
                <rect x={x - barWidth / 2} y={top + plotHeight - barHeight} width={barWidth} height={barHeight} fill="#ff6b2c" rx="4" />
                <text x={x} y={height - 28} textAnchor="middle" fontSize="12" fill="#b5bbcb">{formatShortDate(row.label)}</text>
              </g>
            );
          })}
          <polyline points={points} fill="none" stroke="#8ea0ff" strokeWidth="2.5" />
          <text x={18} y={top + plotHeight / 2} transform={`rotate(-90 18 ${top + plotHeight / 2})`} textAnchor="middle" fontSize="13" fontWeight="700" fill="#b5bbcb">Amount</text>
          <text x={left + plotWidth / 2} y={height - 4} textAnchor="middle" fontSize="13" fontWeight="700" fill="#b5bbcb">Date</text>
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
    <Paper variant="outlined" sx={{ borderRadius: 1, p: 2, height: "100%", borderColor: "rgba(255,255,255,0.08)", bgcolor: "rgba(32,35,45,0.92)" }}>
      <Typography variant="h5" sx={{ fontWeight: 900, color: "text.primary", mb: 2 }}>{title}</Typography>
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
              <Box key={row.label} sx={{ display: "grid", gridTemplateColumns: "14px 1fr auto", gap: 1, alignItems: "center", py: 0.35 }}>
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

function ChartSkeleton({ title }: { title: string }) {
  return (
    <Paper variant="outlined" sx={{ borderRadius: 1, p: 2, minHeight: 320, borderColor: "rgba(255,255,255,0.08)", bgcolor: "rgba(32,35,45,0.92)" }}>
      <Typography variant="h5" sx={{ fontWeight: 900, color: "text.primary", mb: 2 }}>{title}</Typography>
      <Skeleton variant="rectangular" height={238} sx={{ borderRadius: 1 }} />
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
    <Paper variant="outlined" sx={{ borderRadius: 1, overflow: "hidden", borderColor: "rgba(255,255,255,0.08)", bgcolor: "rgba(32,35,45,0.92)" }}>
      <Box sx={{ px: 1.5, py: 1.25, borderBottom: "1px solid", borderColor: "divider", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Typography variant="h5" sx={{ fontWeight: 900, color: type === "expense" ? "primary.main" : "success.main" }}>
          {title}
        </Typography>
        <Typography variant="caption" color="text.secondary">{rows.length} categories</Typography>
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

function BudgetTableSkeleton({ title, type }: { title: string; type: "expense" | "income" }) {
  return (
    <Paper variant="outlined" sx={{ borderRadius: 1, overflow: "hidden", borderColor: "rgba(255,255,255,0.08)", bgcolor: "rgba(32,35,45,0.92)" }}>
      <Box sx={{ px: 1.5, py: 1.25, borderBottom: "1px solid", borderColor: "divider", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Typography variant="h5" sx={{ fontWeight: 900, color: type === "expense" ? "primary.main" : "success.main" }}>
          {title}
        </Typography>
        <Skeleton width={86} height={18} />
      </Box>
      <Box sx={{ p: 1.5, display: "grid", gap: 1 }}>
        {[0, 1, 2, 3, 4, 5, 6].map((row) => (
          <Box key={row} sx={{ display: "grid", gridTemplateColumns: "1fr 112px 112px 112px", gap: 1, alignItems: "center" }}>
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

export function Summary() {
  const { month, prevMonth, nextMonth } = useMonthStore();
  const isCurrentMonth = isCurrentMonthYear(month);

  const transactionsQuery = useQuery({
    queryKey: ["finance", "transactions", month],
    queryFn: () => financeApi.transactions({ month }),
  });

  const plansQuery = useQuery({
    queryKey: ["finance", "plans", month],
    queryFn: () => financeApi.monthlyPlans(month),
  });

  const balanceQuery = useQuery({
    queryKey: ["finance", "balance", month],
    queryFn: () => financeApi.monthlyBalance(month),
  });

  const transactions = transactionsQuery.data?.data ?? [];
  const plans = plansQuery.data ?? [];
  const expenseRows = useMemo(() => buildRows(transactions, plans, "expense"), [transactions, plans]);
  const incomeRows = useMemo(() => buildRows(transactions, plans, "income"), [transactions, plans]);
  const totalSpend = total(transactions, "expense");
  const totalIncome = total(transactions, "income");
  const netSavings = totalIncome - totalSpend;
  const startingBalance = balanceQuery.data?.startingBalance ?? 0;
  const endingBalance = balanceQuery.data?.endingBalance ?? startingBalance + netSavings;
  const plannedSpend = expenseRows.reduce((sum, row) => sum + row.planned, 0);
  const dailySpend = useMemo(() => spendByDate(transactions), [transactions]);
  const categorySpend = useMemo(() => expenseBreakdown(transactions, "category"), [transactions]);
  const mainCategorySpend = useMemo(() => expenseBreakdown(transactions, "mainCategory"), [transactions]);

  return (
    <Box>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2, gap: 2, flexWrap: "wrap" }}>
        <Box>
          <Typography variant="overline" color="primary.main" sx={{ fontWeight: 900 }}>Overview</Typography>
          <Typography variant="h1" sx={{ fontWeight: 900 }}>{formatMonthLabel(month)}</Typography>
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, px: 1, py: 0.5, border: "1px solid", borderColor: "rgba(255,255,255,0.1)", borderRadius: 1, bgcolor: "rgba(32,35,45,0.92)" }}>
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

      {transactionsQuery.isError && <Alert severity="error" sx={{ mb: 2 }}>Failed to load transactions</Alert>}
      {plansQuery.isError && <Alert severity="error" sx={{ mb: 2 }}>Failed to load monthly plans</Alert>}
      {balanceQuery.isError && <Alert severity="error" sx={{ mb: 2 }}>Failed to load monthly balance</Alert>}

      {transactionsQuery.isLoading || balanceQuery.isLoading || plansQuery.isLoading ? (
        <SummaryHeroSkeleton />
      ) : (
        <SummaryHero
          startingBalance={startingBalance}
          endingBalance={endingBalance}
          totalSpend={totalSpend}
          totalIncome={totalIncome}
          plannedSpend={plannedSpend}
          netSavings={netSavings}
        />
      )}

      <Grid container spacing={2} sx={{ my: 2 }}>
        <Grid size={{ xs: 12, md: 3 }}>
          {balanceQuery.isLoading ? <MetricSkeleton /> : <Metric label="Starting Balance" value={currency(startingBalance)} />}
        </Grid>
        <Grid size={{ xs: 12, md: 3 }}>
          {balanceQuery.isLoading || transactionsQuery.isLoading ? <MetricSkeleton /> : <Metric label="Ending Balance" value={currency(endingBalance)} />}
        </Grid>
        <Grid size={{ xs: 12, md: 3 }}>
          {transactionsQuery.isLoading || plansQuery.isLoading ? <MetricSkeleton /> : <Metric label="Income" value={currency(totalIncome)} helper={`${incomeRows.length} categories`} />}
        </Grid>
        <Grid size={{ xs: 12, md: 3 }}>
          {transactionsQuery.isLoading ? <MetricSkeleton /> : <Metric label="Expenses" value={currency(totalSpend)} helper={`${transactions.length} rows loaded`} />}
        </Grid>
      </Grid>

      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid size={{ xs: 12 }}>
          {transactionsQuery.isLoading ? <ChartSkeleton title="Money spent by date" /> : <SpendByDateChart rows={dailySpend} />}
        </Grid>
        <Grid size={{ xs: 12, lg: 6 }}>
          {transactionsQuery.isLoading ? <ChartSkeleton title="Percentage spent on Category" /> : <BreakdownChart title="Percentage spent on Category" rows={categorySpend} />}
        </Grid>
        <Grid size={{ xs: 12, lg: 6 }}>
          {transactionsQuery.isLoading ? <ChartSkeleton title="Percentage spent on Main Category" /> : <BreakdownChart title="Percentage spent on Main Category" rows={mainCategorySpend} />}
        </Grid>
      </Grid>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, lg: 7 }}>
          {transactionsQuery.isLoading || plansQuery.isLoading ? <BudgetTableSkeleton title="Expenses" type="expense" /> : <BudgetTable title="Expenses" rows={expenseRows} type="expense" />}
        </Grid>
        <Grid size={{ xs: 12, lg: 5 }}>
          {transactionsQuery.isLoading || plansQuery.isLoading ? <BudgetTableSkeleton title="Income" type="income" /> : <BudgetTable title="Income" rows={incomeRows} type="income" />}
        </Grid>
      </Grid>
    </Box>
  );
}
