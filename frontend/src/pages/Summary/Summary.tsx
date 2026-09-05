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
import { financeApi } from "@/api/finance.api";
import { FinanceTransaction } from "@/types/finance.types";
import { useMonthStore, isCurrentMonthYear } from "@/store/monthStore";

interface RollupRow {
  category: string;
  amount: number;
  count: number;
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

function rollup(rows: FinanceTransaction[], key: "category" | "mainCategory"): RollupRow[] {
  const totals = new Map<string, RollupRow>();
  rows.forEach((row) => {
    const category = row[key] || "Uncategorized";
    const current = totals.get(category) ?? { category, amount: 0, count: 0 };
    totals.set(category, {
      category,
      amount: current.amount + row.amount,
      count: current.count + 1,
    });
  });
  return [...totals.values()].sort((a, b) => b.amount - a.amount);
}

function Metric({
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

function RollupTable({ title, rows }: { title: string; rows: RollupRow[] }) {
  const total = rows.reduce((sum, row) => sum + row.amount, 0);

  return (
    <Paper variant="outlined" sx={{ borderRadius: 1, overflow: "hidden" }}>
      <Box sx={{ px: 1.5, py: 1.25 }}>
        <Typography variant="h6" sx={{ fontWeight: 800, color: "error.main" }}>
          {title}
        </Typography>
      </Box>
      <TableContainer sx={{ maxHeight: "calc(100vh - 360px)" }}>
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow>
              <TableCell>Category</TableCell>
              <TableCell align="right">Actual</TableCell>
              <TableCell align="right">Share</TableCell>
              <TableCell align="right">Rows</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row) => {
              const percent = total > 0 ? (row.amount / total) * 100 : 0;
              return (
                <TableRow key={row.category} hover>
                  <TableCell sx={{ fontWeight: 600 }}>{row.category}</TableCell>
                  <TableCell align="right">{currency(row.amount)}</TableCell>
                  <TableCell align="right" sx={{ width: 150 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <LinearProgress variant="determinate" value={percent} sx={{ flex: 1 }} />
                      <Typography variant="caption" color="text.secondary" sx={{ minWidth: 38 }}>
                        {percent.toFixed(0)}%
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell align="right">{row.count}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
}

export function Summary() {
  const { month, prevMonth, nextMonth } = useMonthStore();
  const isCurrentMonth = isCurrentMonthYear(month);

  const statusQuery = useQuery({
    queryKey: ["finance", "status"],
    queryFn: financeApi.status,
  });
  const transactionsQuery = useQuery({
    queryKey: ["finance", "transactions", month],
    queryFn: () => financeApi.transactions({ month }),
  });

  const transactions = transactionsQuery.data?.data ?? [];
  const expenses = transactions.filter((row) => row.type === "expense");
  const income = transactions.filter((row) => row.type === "income");
  const totalSpend = expenses.reduce((sum, row) => sum + row.amount, 0);
  const totalIncome = income.reduce((sum, row) => sum + row.amount, 0);
  const netSavings = totalIncome - totalSpend;
  const spentByCategory = useMemo(() => rollup(expenses, "category"), [expenses]);
  const spentByMainCategory = useMemo(() => rollup(expenses, "mainCategory"), [expenses]);

  const loading = statusQuery.isLoading || transactionsQuery.isLoading;
  const error =
    statusQuery.isError ||
    transactionsQuery.isError ||
    statusQuery.data?.configured === false
      ? "Failed to load Google Sheets finance data"
      : null;

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1440, mx: "auto" }}>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800 }}>Monthly Summary</Typography>
          <Typography variant="body2" color="text.secondary">
            Calculated from the private Google Sheets Transactions tab.
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
              <Metric label="Income" value={currency(totalIncome)} helper={`${income.length} income rows`} />
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <Metric label="Expenses" value={currency(totalSpend)} helper={`${expenses.length} expense rows`} />
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <Metric label="Net Savings" value={currency(netSavings)} helper="Income minus expenses" />
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <Metric label="Rows" value={String(transactions.length)} helper="Loaded from Google Sheets" />
            </Grid>
          </Grid>

          <Grid container spacing={2}>
            <Grid size={{ xs: 12, lg: 6 }}>
              <RollupTable title="Expenses by Category" rows={spentByCategory} />
            </Grid>
            <Grid size={{ xs: 12, lg: 6 }}>
              <RollupTable title="Expenses by Main Category" rows={spentByMainCategory} />
            </Grid>
          </Grid>
        </>
      )}
    </Box>
  );
}
