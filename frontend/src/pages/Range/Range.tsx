import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Alert,
  Box,
  Button,
  Grid,
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
import FilterAltOutlinedIcon from "@mui/icons-material/FilterAltOutlined";
import { financeApi, YearlyCategorySummary } from "@/api/finance.api";
import { MetricCard, MetricCardSkeleton } from "@/components/finance/MetricCard";
import { PageHero } from "@/components/finance/PageHero";
import { currency, currencyWithCents, signedCurrency } from "@/components/finance/financeFormat";
import { WidgetCard } from "@/components/finance/WidgetCard";

function isoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function today(): string {
  return isoDate(new Date());
}

function yearStart(): string {
  const now = new Date();
  return `${now.getFullYear()}-01-01`;
}

function daysAgo(days: number): string {
  const value = new Date();
  value.setDate(value.getDate() - days);
  return isoDate(value);
}

function formatRangeDate(value: string): string {
  return new Date(`${value}T00:00:00`).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

interface CategoryNode {
  row: YearlyCategorySummary;
  children: CategoryNode[];
}

function categoryRows(rows: YearlyCategorySummary[]): YearlyCategorySummary[] {
  const nodes = new Map<string, CategoryNode>();
  rows.forEach((row) => nodes.set(row.categoryId ?? "uncategorized", { row, children: [] }));

  const roots: CategoryNode[] = [];
  nodes.forEach((node) => {
    const parent = node.row.categoryPath[node.row.depth - 1];
    const parentNode = parent ? nodes.get(parent.id) : null;
    if (parentNode) parentNode.children.push(node);
    else roots.push(node);
  });

  const sort = (items: CategoryNode[]) => {
    items.sort((a, b) => b.row.amount - a.row.amount || a.row.categoryName.localeCompare(b.row.categoryName));
    items.forEach((item) => sort(item.children));
  };
  sort(roots);

  const flattened: YearlyCategorySummary[] = [];
  const visit = (node: CategoryNode) => {
    flattened.push(node.row);
    node.children.forEach(visit);
  };
  roots.forEach(visit);
  return flattened;
}

export function RangeReport() {
  const [draftFrom, setDraftFrom] = useState(yearStart);
  const [draftTo, setDraftTo] = useState(today);
  const [range, setRange] = useState({ from: yearStart(), to: today() });
  const invalidRange = !draftFrom || !draftTo || draftFrom > draftTo;

  const rangeQuery = useQuery({
    queryKey: ["finance", "range-summary", range.from, range.to],
    queryFn: () => financeApi.dateRangeSummary(range.from, range.to),
  });
  const data = rangeQuery.data;
  const rows = useMemo(() => categoryRows(data?.categorySpend ?? []), [data?.categorySpend]);

  const applyRange = (from: string, to: string) => {
    setDraftFrom(from);
    setDraftTo(to);
    setRange({ from, to });
  };

  return (
    <Box>
      <PageHero
        eyebrow="Reports"
        title="Custom range"
        actions={(
          <Typography color="text.secondary" sx={{ fontWeight: 750 }}>
            {formatRangeDate(range.from)} – {formatRangeDate(range.to)}
          </Typography>
        )}
      />

      <Paper variant="outlined" sx={{ p: 2, mb: 2, borderRadius: 1, borderColor: "rgba(255,255,255,0.08)", bgcolor: "rgba(32,35,45,0.92)" }}>
        <Box sx={{ display: "flex", alignItems: "end", gap: 1.5, flexWrap: "wrap" }}>
          <TextField
            label="From"
            type="date"
            size="small"
            value={draftFrom}
            onChange={(event) => setDraftFrom(event.target.value)}
            slotProps={{ inputLabel: { shrink: true }, htmlInput: { max: draftTo || today() } }}
          />
          <TextField
            label="To"
            type="date"
            size="small"
            value={draftTo}
            onChange={(event) => setDraftTo(event.target.value)}
            slotProps={{ inputLabel: { shrink: true }, htmlInput: { min: draftFrom, max: today() } }}
          />
          <Button
            variant="contained"
            startIcon={<FilterAltOutlinedIcon />}
            disabled={invalidRange}
            onClick={() => setRange({ from: draftFrom, to: draftTo })}
          >
            Apply
          </Button>
          <Box sx={{ display: "flex", gap: 0.75, flexWrap: "wrap", ml: { lg: "auto" } }}>
            <Button size="small" variant="outlined" onClick={() => applyRange(daysAgo(29), today())}>Last 30 days</Button>
            <Button size="small" variant="outlined" onClick={() => applyRange(daysAgo(89), today())}>Last 90 days</Button>
            <Button size="small" variant="outlined" onClick={() => applyRange(yearStart(), today())}>Year to date</Button>
          </Box>
        </Box>
        {invalidRange && <Typography color="error.main" variant="caption" sx={{ display: "block", mt: 1 }}>Choose a valid date range.</Typography>}
      </Paper>

      {rangeQuery.isError && <Alert severity="error" sx={{ mb: 2 }}>Failed to load the selected date range.</Alert>}

      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid size={{ xs: 12, sm: 6, lg: 2.4 }}>{rangeQuery.isLoading ? <MetricCardSkeleton /> : <MetricCard label="Income" value={currency(data?.totals.income ?? 0)} tone="good" />}</Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 2.4 }}>{rangeQuery.isLoading ? <MetricCardSkeleton /> : <MetricCard label="Expenses" value={currency(data?.totals.expenses ?? 0)} tone="bad" />}</Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 2.4 }}>{rangeQuery.isLoading ? <MetricCardSkeleton /> : <MetricCard label="Net" value={signedCurrency(data?.totals.net ?? 0)} tone={(data?.totals.net ?? 0) >= 0 ? "good" : "bad"} />}</Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 2.4 }}>{rangeQuery.isLoading ? <MetricCardSkeleton /> : <MetricCard label="Average per day" value={currencyWithCents(data?.totals.averageDailySpend ?? 0)} helper={`${data?.days ?? 0} calendar days`} />}</Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 2.4 }}>{rangeQuery.isLoading ? <MetricCardSkeleton /> : <MetricCard label="Transactions" value={(data?.transactionCount ?? 0).toLocaleString()} helper={`${data?.months.length ?? 0} months`} />}</Grid>
      </Grid>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, lg: 5 }}>
          <WidgetCard title="Monthly breakdown" meta={<Typography variant="caption" color="text.secondary">Selected dates only</Typography>}>
            <TableContainer sx={{ maxHeight: 520 }}>
              <Table stickyHeader size="small">
                <TableHead><TableRow><TableCell>Month</TableCell><TableCell align="right">Income</TableCell><TableCell align="right">Expenses</TableCell><TableCell align="right">Net</TableCell></TableRow></TableHead>
                <TableBody>
                  {rangeQuery.isLoading ? Array.from({ length: 5 }, (_, index) => <TableRow key={index}><TableCell colSpan={4}><Skeleton height={28} /></TableCell></TableRow>) :
                    (data?.months.length ?? 0) === 0 ? <TableRow><TableCell colSpan={4}><Typography color="text.secondary" sx={{ py: 3, textAlign: "center" }}>No transactions in this range.</Typography></TableCell></TableRow> :
                      data?.months.map((month) => <TableRow key={month.monthYear} hover><TableCell sx={{ fontWeight: 800 }}>{month.monthLabel}</TableCell><TableCell align="right">{currency(month.income)}</TableCell><TableCell align="right">{currency(month.expenses)}</TableCell><TableCell align="right" sx={{ color: month.net >= 0 ? "success.main" : "primary.main", fontWeight: 800 }}>{signedCurrency(month.net)}</TableCell></TableRow>)}
                </TableBody>
              </Table>
            </TableContainer>
          </WidgetCard>
        </Grid>

        <Grid size={{ xs: 12, lg: 7 }}>
          <WidgetCard title="Spend by category" meta={<Typography variant="caption" color="text.secondary">{rows.length} categories</Typography>}>
            <TableContainer sx={{ maxHeight: 520 }}>
              <Table stickyHeader size="small">
                <TableHead><TableRow><TableCell>Category</TableCell><TableCell align="right">Amount</TableCell><TableCell align="right">Txns</TableCell><TableCell align="right">%</TableCell></TableRow></TableHead>
                <TableBody>
                  {rangeQuery.isLoading ? Array.from({ length: 7 }, (_, index) => <TableRow key={index}><TableCell colSpan={4}><Skeleton height={28} /></TableCell></TableRow>) :
                    rows.length === 0 ? <TableRow><TableCell colSpan={4}><Typography color="text.secondary" sx={{ py: 3, textAlign: "center" }}>No expenses in this range.</Typography></TableCell></TableRow> :
                      rows.map((row) => <TableRow key={row.categoryId ?? "uncategorized"} hover><TableCell sx={{ pl: 1.5 + row.depth * 2.25, fontWeight: row.depth === 0 ? 850 : 650 }}>{row.categoryName}</TableCell><TableCell align="right" sx={{ color: "primary.main", fontWeight: 800 }}>{currency(row.amount)}</TableCell><TableCell align="right">{row.count}</TableCell><TableCell align="right">{(data?.totals.expenses ?? 0) > 0 ? `${((row.amount / (data?.totals.expenses ?? 1)) * 100).toFixed(1)}%` : "0%"}</TableCell></TableRow>)}
                </TableBody>
              </Table>
            </TableContainer>
          </WidgetCard>
        </Grid>
      </Grid>
    </Box>
  );
}
