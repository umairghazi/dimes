import { useState } from "react";
import {
  Box,
  Grid,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Skeleton,
  LinearProgress,
  FormControlLabel,
  Switch,
} from "@mui/material";
import { BudgetComparison } from "@/types/analytics.types";

interface Props {
  expenses: BudgetComparison | null;
  income: BudgetComparison | null;
  loading: boolean;
  onCategoryClick?: (category: string) => void;
}

function fmt(n: number) {
  return `$${Math.abs(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function DiffCell({ value }: { value: number; positiveIsGood: boolean }) {
  const color = value > 0 ? "success.main" : value < 0 ? "error.main" : "text.secondary";
  const label = value >= 0 ? `+${fmt(value)}` : `-${fmt(value)}`;
  return (
    <TableCell align="right" sx={{ color, fontWeight: 600, fontVariantNumeric: "tabular-nums", py: 0.75 }}>
      {label}
    </TableCell>
  );
}

interface SummaryBarProps {
  label: string;
  value: number;
  maxValue: number;
  color: string;
}

function SummaryBar({ label, value, maxValue, color }: SummaryBarProps) {
  const pct = maxValue > 0 ? Math.min((value / maxValue) * 100, 100) : 0;
  return (
    <Box sx={{ mb: 1.5 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
          {label}
        </Typography>
        <Typography variant="caption" sx={{ fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>
          {fmt(value)}
        </Typography>
      </Box>
      <LinearProgress
        variant="determinate"
        value={pct}
        sx={{
          height: 8,
          borderRadius: 4,
          bgcolor: "action.hover",
          "& .MuiLinearProgress-bar": { bgcolor: color, borderRadius: 4 },
        }}
      />
    </Box>
  );
}

interface PanelProps {
  title: string;
  titleColor: string;
  data: BudgetComparison | null;
  positiveIsGood: boolean;
  onCategoryClick?: (category: string) => void;
}

function Panel({ title, titleColor, data, positiveIsGood, onCategoryClick }: PanelProps) {
  const [hideEmpty, setHideEmpty] = useState(false);

  if (!data) return null;

  const maxBarValue = Math.max(data.totals.planned, data.totals.actual, 1);
  const rows = hideEmpty
    ? data.rows.filter((r) => r.planned > 0 || r.actual > 0)
    : data.rows;

  return (
    <Box>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, color: titleColor, letterSpacing: "-0.01em" }}>
          {title}
        </Typography>
        <FormControlLabel
          control={
            <Switch size="small" checked={hideEmpty} onChange={(e) => setHideEmpty(e.target.checked)} />
          }
          label={<Typography variant="caption">Hide $0</Typography>}
          sx={{ mr: 0 }}
        />
      </Box>

      <Box sx={{ mb: 2.5 }}>
        <SummaryBar label="Planned" value={data.totals.planned} maxValue={maxBarValue} color={titleColor} />
        <SummaryBar label="Actual" value={data.totals.actual} maxValue={maxBarValue} color={titleColor + "99"} />
      </Box>

      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 700, py: 0.75 }}>
                {title === "Income" ? "Source" : "Category"}
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: 700, py: 0.75 }}>Planned</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700, py: 0.75 }}>Actual</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700, py: 0.75 }}>Diff</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            <TableRow sx={{ bgcolor: "action.hover" }}>
              <TableCell sx={{ fontWeight: 700, py: 0.75 }}>Totals</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700, fontVariantNumeric: "tabular-nums", py: 0.75 }}>
                {fmt(data.totals.planned)}
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: 700, fontVariantNumeric: "tabular-nums", py: 0.75 }}>
                {fmt(data.totals.actual)}
              </TableCell>
              <DiffCell value={data.totals.diff} positiveIsGood={positiveIsGood} />
            </TableRow>

            {rows.map((row) => (
              <TableRow
                key={row.category}
                hover
                onClick={onCategoryClick ? () => onCategoryClick(row.category) : undefined}
                sx={onCategoryClick ? { cursor: "pointer" } : undefined}
              >
                <TableCell sx={{ py: 0.75 }}>{row.category}</TableCell>
                <TableCell align="right" sx={{ color: "text.secondary", fontVariantNumeric: "tabular-nums", py: 0.75 }}>
                  {fmt(row.planned)}
                </TableCell>
                <TableCell align="right" sx={{ fontVariantNumeric: "tabular-nums", py: 0.75 }}>
                  {fmt(row.actual)}
                </TableCell>
                <DiffCell value={row.diff} positiveIsGood={positiveIsGood} />
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

export function IncomeExpenseOverview({ expenses, income, loading, onCategoryClick }: Props) {
  if (loading) {
    return (
      <Box>
        {Array.from({ length: 10 }).map((_, i) => (
          <Skeleton key={i} height={40} sx={{ mb: 0.5 }} />
        ))}
      </Box>
    );
  }

  const netSavings = (income?.totals.actual ?? 0) - (expenses?.totals.actual ?? 0);
  const netColor = netSavings >= 0 ? "success.main" : "error.main";

  return (
    <Box>
      <Grid container spacing={4}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Panel
            title="Expenses"
            titleColor="#ef4444"
            data={expenses}
            positiveIsGood={true}
            onCategoryClick={onCategoryClick}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Panel
            title="Income"
            titleColor="#22c55e"
            data={income}
            positiveIsGood={true}
          />
        </Grid>
      </Grid>

      <Box
        sx={{
          mt: 3,
          pt: 2.5,
          borderTop: 1,
          borderColor: "divider",
          display: "flex",
          alignItems: "baseline",
          gap: 1.5,
        }}
      >
        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
          Net Savings
        </Typography>
        <Typography
          sx={{ fontSize: "1.5rem", fontWeight: 800, letterSpacing: "-0.03em", color: netColor }}
        >
          {netSavings >= 0 ? "+" : "-"}{fmt(netSavings)}
        </Typography>
        {income && income.totals.planned > 0 && (
          <Typography variant="body2" color="text.secondary">
            ({((netSavings / income.totals.planned) * 100).toFixed(0)}% of planned income)
          </Typography>
        )}
      </Box>
    </Box>
  );
}
