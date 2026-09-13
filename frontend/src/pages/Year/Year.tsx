import { useMemo, useState } from "react";
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
import { useNavigate } from "react-router-dom";
import { financeApi, YearlySummaryMonth } from "@/api/finance.api";
import { useMonthStore } from "@/store/monthStore";
import { MetricCard } from "@/components/finance/MetricCard";
import { currency, signedCurrency } from "@/components/finance/financeFormat";

function currentYear(): number {
  return new Date().getFullYear();
}

function nullableCurrency(value: number | null): string {
  if (value === null) return "—";
  return currency(value);
}

function ChartSkeleton({ title }: { title: string }) {
  return (
    <Paper variant="outlined" sx={{ p: 2, borderRadius: 1, minHeight: 320, borderColor: "rgba(255,255,255,0.08)", bgcolor: "rgba(32,35,45,0.92)" }}>
      <Typography variant="h5" sx={{ fontWeight: 900, mb: 2 }}>{title}</Typography>
      <Skeleton variant="rectangular" height={240} sx={{ borderRadius: 1 }} />
    </Paper>
  );
}

function IncomeExpenseChart({ months }: { months: YearlySummaryMonth[] }) {
  const width = 920;
  const height = 300;
  const left = 74;
  const right = 24;
  const top = 30;
  const bottom = 54;
  const plotWidth = width - left - right;
  const plotHeight = height - top - bottom;
  const max = Math.max(...months.flatMap((month) => [month.income, month.expenses]), 1);
  const band = plotWidth / 12;
  const barWidth = Math.min(24, band * 0.28);
  const ticks = [0, 0.5, 1];

  return (
    <Paper variant="outlined" sx={{ p: 2, borderRadius: 1, overflowX: "auto", borderColor: "rgba(255,255,255,0.08)", bgcolor: "rgba(32,35,45,0.92)" }}>
      <Typography variant="h5" sx={{ fontWeight: 900, mb: 1 }}>Monthly income vs expenses</Typography>
      <Box component="svg" viewBox={`0 0 ${width} ${height}`} sx={{ width: "100%", minWidth: 760, display: "block" }}>
        {ticks.map((tick) => {
          const y = top + plotHeight - tick * plotHeight;
          return (
            <g key={tick}>
              <line x1={left} x2={width - right} y1={y} y2={y} stroke="currentColor" opacity="0.12" />
              <text x={left - 10} y={y + 4} textAnchor="end" fontSize="12" fill="#b5bbcb">{currency(max * tick)}</text>
            </g>
          );
        })}
        <line x1={left} x2={width - right} y1={top + plotHeight} y2={top + plotHeight} stroke="#535b70" />
        {months.map((month, index) => {
          const x = left + band * index + band / 2;
          const incomeHeight = (month.income / max) * plotHeight;
          const expenseHeight = (month.expenses / max) * plotHeight;
          return (
            <g key={month.monthYear}>
              <rect x={x - barWidth - 2} y={top + plotHeight - incomeHeight} width={barWidth} height={incomeHeight} fill="#29cc7a" rx="4">
                <title>{month.monthLabel} income: {currency(month.income)}</title>
              </rect>
              <rect x={x + 2} y={top + plotHeight - expenseHeight} width={barWidth} height={expenseHeight} fill="#ff6b2c" rx="4">
                <title>{month.monthLabel} expenses: {currency(month.expenses)}</title>
              </rect>
              <text x={x} y={height - 24} textAnchor="middle" fontSize="12" fill="#b5bbcb">{month.monthLabel}</text>
            </g>
          );
        })}
        <text x={left + plotWidth / 2} y={height - 4} textAnchor="middle" fontSize="13" fontWeight="700" fill="#b5bbcb">Month</text>
      </Box>
    </Paper>
  );
}

function BalanceTrendChart({ months }: { months: YearlySummaryMonth[] }) {
  const points = months.filter((month) => month.endingBalance !== null);
  const width = 920;
  const height = 300;
  const left = 74;
  const right = 24;
  const top = 30;
  const bottom = 54;
  const plotWidth = width - left - right;
  const plotHeight = height - top - bottom;
  const max = Math.max(...points.map((month) => month.endingBalance ?? 0), 1);
  const band = plotWidth / 12;
  const line = points.map((month) => {
    const index = months.findIndex((candidate) => candidate.monthYear === month.monthYear);
    const x = left + band * index + band / 2;
    const y = top + plotHeight - ((month.endingBalance ?? 0) / max) * plotHeight;
    return `${x},${y}`;
  }).join(" ");

  return (
    <Paper variant="outlined" sx={{ p: 2, borderRadius: 1, overflowX: "auto", borderColor: "rgba(255,255,255,0.08)", bgcolor: "rgba(32,35,45,0.92)" }}>
      <Typography variant="h5" sx={{ fontWeight: 900, mb: 1 }}>Ending account balance</Typography>
      {points.length === 0 ? (
        <Typography color="text.secondary">No balances entered for this year.</Typography>
      ) : (
        <Box component="svg" viewBox={`0 0 ${width} ${height}`} sx={{ width: "100%", minWidth: 760, display: "block" }}>
          {[0, 0.5, 1].map((tick) => {
            const y = top + plotHeight - tick * plotHeight;
            return (
              <g key={tick}>
                <line x1={left} x2={width - right} y1={y} y2={y} stroke="currentColor" opacity="0.12" />
                <text x={left - 10} y={y + 4} textAnchor="end" fontSize="12" fill="#b5bbcb">{currency(max * tick)}</text>
              </g>
            );
          })}
          <line x1={left} x2={width - right} y1={top + plotHeight} y2={top + plotHeight} stroke="#535b70" />
          <polyline points={line} fill="none" stroke="#8ea0ff" strokeWidth="3" />
          {months.map((month, index) => {
            const x = left + band * index + band / 2;
            if (month.endingBalance === null) {
              return <text key={month.monthYear} x={x} y={height - 24} textAnchor="middle" fontSize="12" fill="#b5bbcb">{month.monthLabel}</text>;
            }
            const y = top + plotHeight - (month.endingBalance / max) * plotHeight;
            return (
              <g key={month.monthYear}>
                <circle cx={x} cy={y} r="5" fill="#8ea0ff">
                  <title>{month.monthLabel} ending balance: {nullableCurrency(month.endingBalance)}</title>
                </circle>
                <text x={x} y={height - 24} textAnchor="middle" fontSize="12" fill="#b5bbcb">{month.monthLabel}</text>
              </g>
            );
          })}
          <text x={left + plotWidth / 2} y={height - 4} textAnchor="middle" fontSize="13" fontWeight="700" fill="#b5bbcb">Month</text>
        </Box>
      )}
    </Paper>
  );
}

export function Year() {
  const navigate = useNavigate();
  const setMonth = useMonthStore((state) => state.setMonth);
  const [year, setYear] = useState(currentYear());

  const yearlyQuery = useQuery({
    queryKey: ["finance", "yearly-summary", year],
    queryFn: () => financeApi.yearlySummary(year),
  });

  const data = yearlyQuery.data;
  const months = data?.months ?? [];
  const latestEndingBalance = useMemo(() => [...months].reverse().find((month) => month.endingBalance !== null)?.endingBalance ?? null, [months]);

  const openMonth = (monthYear: string) => {
    setMonth(monthYear);
    navigate("/");
  };

  return (
    <Box>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2, gap: 2, flexWrap: "wrap" }}>
        <Box>
          <Typography variant="overline" color="primary.main" sx={{ fontWeight: 900 }}>Year to date</Typography>
          <Typography variant="h1" sx={{ fontWeight: 900 }}>{year}</Typography>
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, px: 1, py: 0.5, border: "1px solid", borderColor: "rgba(255,255,255,0.1)", borderRadius: 1, bgcolor: "rgba(32,35,45,0.92)" }}>
          <IconButton size="small" onClick={() => setYear((value) => value - 1)}>
            <ChevronLeftIcon />
          </IconButton>
          <Typography variant="subtitle1" sx={{ fontWeight: 760, minWidth: 88, textAlign: "center" }}>{year}</Typography>
          <IconButton size="small" onClick={() => setYear((value) => value + 1)} disabled={year >= currentYear()}>
            <ChevronRightIcon />
          </IconButton>
        </Box>
      </Box>

      {yearlyQuery.isError && <Alert severity="error" sx={{ mb: 2 }}>Failed to load yearly summary</Alert>}

      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid size={{ xs: 12, md: 3 }}>{yearlyQuery.isLoading ? <Skeleton height={110} /> : <MetricCard label="Income" value={currency(data?.totals.income ?? 0)} tone="good" />}</Grid>
        <Grid size={{ xs: 12, md: 3 }}>{yearlyQuery.isLoading ? <Skeleton height={110} /> : <MetricCard label="Expenses" value={currency(data?.totals.expenses ?? 0)} tone="bad" />}</Grid>
        <Grid size={{ xs: 12, md: 3 }}>{yearlyQuery.isLoading ? <Skeleton height={110} /> : <MetricCard label="Net" value={signedCurrency(data?.totals.net ?? 0)} tone={(data?.totals.net ?? 0) >= 0 ? "good" : "bad"} />}</Grid>
        <Grid size={{ xs: 12, md: 3 }}>{yearlyQuery.isLoading ? <Skeleton height={110} /> : <MetricCard label="Latest ending balance" value={nullableCurrency(latestEndingBalance)} />}</Grid>
      </Grid>

      <Paper variant="outlined" sx={{ borderRadius: 1, overflow: "hidden", mb: 2, borderColor: "rgba(255,255,255,0.08)", bgcolor: "rgba(32,35,45,0.92)" }}>
        <Box sx={{ px: 1.5, py: 1.25, borderBottom: "1px solid", borderColor: "divider", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Typography variant="h5" sx={{ fontWeight: 900, color: "text.primary" }}>Monthly breakdown</Typography>
          <Typography variant="caption" color="text.secondary">Click a month to open overview</Typography>
        </Box>
        <TableContainer>
          <Table size="small" sx={{ minWidth: 860 }}>
            <TableHead>
              <TableRow>
                <TableCell>Month</TableCell>
                <TableCell align="right">Income</TableCell>
                <TableCell align="right">Expenses</TableCell>
                <TableCell align="right">Net</TableCell>
                <TableCell align="right">Starting Balance</TableCell>
                <TableCell align="right">Ending Balance</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {yearlyQuery.isLoading ? (
                Array.from({ length: 6 }, (_, index) => (
                  <TableRow key={index}>
                    <TableCell colSpan={6}><Skeleton height={28} /></TableCell>
                  </TableRow>
                ))
              ) : (
                months.map((month) => (
                  <TableRow key={month.monthYear} hover onClick={() => openMonth(month.monthYear)} sx={{ cursor: "pointer" }}>
                    <TableCell sx={{ fontWeight: 800 }}>{month.monthLabel}</TableCell>
                    <TableCell align="right" sx={{ color: "success.main", fontWeight: 700 }}>{currency(month.income)}</TableCell>
                    <TableCell align="right" sx={{ color: "primary.main", fontWeight: 700 }}>{currency(month.expenses)}</TableCell>
                    <TableCell align="right" sx={{ color: month.net >= 0 ? "success.main" : "primary.main", fontWeight: 800 }}>{signedCurrency(month.net)}</TableCell>
                    <TableCell align="right">{nullableCurrency(month.startingBalance)}</TableCell>
                    <TableCell align="right">{nullableCurrency(month.endingBalance)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, lg: 6 }}>
          {yearlyQuery.isLoading ? <ChartSkeleton title="Monthly income vs expenses" /> : <IncomeExpenseChart months={months} />}
        </Grid>
        <Grid size={{ xs: 12, lg: 6 }}>
          {yearlyQuery.isLoading ? <ChartSkeleton title="Ending account balance" /> : <BalanceTrendChart months={months} />}
        </Grid>
      </Grid>
    </Box>
  );
}
