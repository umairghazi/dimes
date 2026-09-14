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
import { financeApi, YearlyCategorySummary, YearlySummaryMonth } from "@/api/finance.api";
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

interface BalanceChartPoint {
  month: YearlySummaryMonth;
  x: number;
  y: number;
  value: number;
}

function smoothPath(points: BalanceChartPoint[]): string {
  if (points.length === 0) return "";
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

  return points.reduce((path, point, index) => {
    if (index === 0) return `M ${point.x} ${point.y}`;

    const previous = points[index - 1];
    const next = points[index + 1] ?? point;
    const beforePrevious = points[index - 2] ?? previous;
    const tension = 0.18;
    const cp1x = previous.x + (point.x - beforePrevious.x) * tension;
    const cp1y = previous.y + (point.y - beforePrevious.y) * tension;
    const cp2x = point.x - (next.x - previous.x) * tension;
    const cp2y = point.y - (next.y - previous.y) * tension;

    return `${path} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${point.x} ${point.y}`;
  }, "");
}

function BalanceTrendChart({ months }: { months: YearlySummaryMonth[] }) {
  const [tooltip, setTooltip] = useState<BalanceChartPoint | null>(null);
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
  const chartPoints: BalanceChartPoint[] = points.map((month) => {
    const index = months.findIndex((candidate) => candidate.monthYear === month.monthYear);
    const x = left + band * index + band / 2;
    const y = top + plotHeight - ((month.endingBalance ?? 0) / max) * plotHeight;
    return { month, x, y, value: month.endingBalance ?? 0 };
  });
  const line = smoothPath(chartPoints);
  const area = chartPoints.length > 0
    ? `${line} L ${chartPoints[chartPoints.length - 1].x} ${top + plotHeight} L ${chartPoints[0].x} ${top + plotHeight} Z`
    : "";
  const tooltipWidth = 168;
  const tooltipHeight = 64;
  const tooltipX = tooltip ? Math.min(Math.max(tooltip.x + 12, left), width - right - tooltipWidth) : 0;
  const tooltipY = tooltip ? Math.max(top, tooltip.y - tooltipHeight - 12) : 0;

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
          {area && <path d={area} fill="rgba(142,160,255,0.12)" />}
          <path d={line} fill="none" stroke="#8ea0ff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
          {months.map((month, index) => {
            const x = left + band * index + band / 2;
            if (month.endingBalance === null) {
              return <text key={month.monthYear} x={x} y={height - 24} textAnchor="middle" fontSize="12" fill="#b5bbcb">{month.monthLabel}</text>;
            }
            const y = top + plotHeight - (month.endingBalance / max) * plotHeight;
            const point = chartPoints.find((candidate) => candidate.month.monthYear === month.monthYear);
            return (
              <g key={month.monthYear}>
                <circle cx={x} cy={y} r="5" fill={tooltip?.month.monthYear === month.monthYear ? "#f7f8fc" : "#8ea0ff"} />
                <circle
                  cx={x}
                  cy={y}
                  r="18"
                  fill="transparent"
                  onMouseEnter={() => point && setTooltip(point)}
                  onMouseMove={() => point && setTooltip(point)}
                  onMouseLeave={() => setTooltip(null)}
                />
                <text x={x} y={height - 24} textAnchor="middle" fontSize="12" fill="#b5bbcb">{month.monthLabel}</text>
              </g>
            );
          })}
          {tooltip && (
            <g pointerEvents="none">
              <rect
                x={tooltipX}
                y={tooltipY}
                width={tooltipWidth}
                height={tooltipHeight}
                rx="8"
                fill="#0f1117"
                stroke="rgba(255,255,255,0.18)"
              />
              <text x={tooltipX + 12} y={tooltipY + 23} fontSize="13" fontWeight="800" fill="#f7f8fc">
                {tooltip.month.monthLabel}
              </text>
              <text x={tooltipX + 12} y={tooltipY + 46} fontSize="14" fontWeight="900" fill="#8ea0ff">
                {nullableCurrency(tooltip.value)}
              </text>
            </g>
          )}
          <text x={left + plotWidth / 2} y={height - 4} textAnchor="middle" fontSize="13" fontWeight="700" fill="#b5bbcb">Month</text>
        </Box>
      )}
    </Paper>
  );
}

function BalanceCashflowComboChart({ months }: { months: YearlySummaryMonth[] }) {
  const [tooltip, setTooltip] = useState<BalanceChartPoint | null>(null);
  const balanceMonths = months.filter((month) => month.endingBalance !== null);
  const width = 920;
  const height = 340;
  const left = 76;
  const right = 28;
  const top = 34;
  const bottom = 58;
  const plotWidth = width - left - right;
  const plotHeight = height - top - bottom;
  const balanceMax = Math.max(...balanceMonths.map((month) => month.endingBalance ?? 0), 1);
  const netMax = Math.max(...months.map((month) => Math.abs(month.net)), 1);
  const band = plotWidth / 12;
  const barWidth = Math.min(34, band * 0.42);
  const zeroY = top + plotHeight / 2;
  const barScale = (plotHeight * 0.42) / netMax;
  const balancePoints: BalanceChartPoint[] = balanceMonths.map((month) => {
    const index = months.findIndex((candidate) => candidate.monthYear === month.monthYear);
    const x = left + band * index + band / 2;
    const y = top + plotHeight - ((month.endingBalance ?? 0) / balanceMax) * plotHeight;
    return { month, x, y, value: month.endingBalance ?? 0 };
  });
  const line = smoothPath(balancePoints);
  const tooltipWidth = 192;
  const tooltipHeight = 86;
  const tooltipX = tooltip ? Math.min(Math.max(tooltip.x + 12, left), width - right - tooltipWidth) : 0;
  const tooltipY = tooltip ? Math.max(top, tooltip.y - tooltipHeight - 12) : 0;

  return (
    <Paper variant="outlined" sx={{ p: 2, borderRadius: 1, overflowX: "auto", borderColor: "rgba(255,255,255,0.08)", bgcolor: "rgba(32,35,45,0.92)" }}>
      <Typography variant="h5" sx={{ fontWeight: 900, mb: 0.5 }}>Balance vs monthly cashflow</Typography>
      <Typography variant="caption" color="text.secondary">Bars show monthly net cashflow. Line shows ending account balance.</Typography>
      {balanceMonths.length === 0 ? (
        <Typography color="text.secondary" sx={{ mt: 2 }}>No balances entered for this year.</Typography>
      ) : (
        <Box component="svg" viewBox={`0 0 ${width} ${height}`} sx={{ width: "100%", minWidth: 760, display: "block", mt: 1 }}>
          {[0, 0.5, 1].map((tick) => {
            const y = top + plotHeight - tick * plotHeight;
            return (
              <g key={tick}>
                <line x1={left} x2={width - right} y1={y} y2={y} stroke="currentColor" opacity="0.1" />
                <text x={left - 10} y={y + 4} textAnchor="end" fontSize="12" fill="#b5bbcb">{currency(balanceMax * tick)}</text>
              </g>
            );
          })}
          <line x1={left} x2={width - right} y1={zeroY} y2={zeroY} stroke="#535b70" strokeDasharray="4 6" />
          {months.map((month, index) => {
            const x = left + band * index + band / 2;
            const heightValue = Math.abs(month.net) * barScale;
            const y = month.net >= 0 ? zeroY - heightValue : zeroY;
            const fill = month.net >= 0 ? "#29cc7a" : "#ff6b2c";
            return (
              <g key={month.monthYear}>
                <rect x={x - barWidth / 2} y={y} width={barWidth} height={heightValue} rx="5" fill={fill} opacity="0.58">
                  <title>{month.monthLabel} net cashflow: {signedCurrency(month.net)}</title>
                </rect>
                <text x={x} y={height - 25} textAnchor="middle" fontSize="12" fill="#b5bbcb">{month.monthLabel}</text>
              </g>
            );
          })}
          <path d={line} fill="none" stroke="#8ea0ff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
          {balancePoints.map((point) => (
            <g key={point.month.monthYear}>
              <circle cx={point.x} cy={point.y} r="5" fill={tooltip?.month.monthYear === point.month.monthYear ? "#f7f8fc" : "#8ea0ff"} />
              <circle
                cx={point.x}
                cy={point.y}
                r="18"
                fill="transparent"
                onMouseEnter={() => setTooltip(point)}
                onMouseMove={() => setTooltip(point)}
                onMouseLeave={() => setTooltip(null)}
              />
            </g>
          ))}
          {tooltip && (
            <g pointerEvents="none">
              <rect
                x={tooltipX}
                y={tooltipY}
                width={tooltipWidth}
                height={tooltipHeight}
                rx="8"
                fill="#0f1117"
                stroke="rgba(255,255,255,0.18)"
              />
              <text x={tooltipX + 12} y={tooltipY + 22} fontSize="13" fontWeight="800" fill="#f7f8fc">
                {tooltip.month.monthLabel}
              </text>
              <text x={tooltipX + 12} y={tooltipY + 44} fontSize="13" fontWeight="900" fill="#8ea0ff">
                Balance {nullableCurrency(tooltip.value)}
              </text>
              <text x={tooltipX + 12} y={tooltipY + 65} fontSize="12" fill={tooltip.month.net >= 0 ? "#29cc7a" : "#ff875c"}>
                Net {signedCurrency(tooltip.month.net)}
              </text>
            </g>
          )}
          <text x={left + plotWidth / 2} y={height - 5} textAnchor="middle" fontSize="13" fontWeight="700" fill="#b5bbcb">Month</text>
        </Box>
      )}
    </Paper>
  );
}

interface YearlyCategoryTreeNode {
  row: YearlyCategorySummary;
  children: YearlyCategoryTreeNode[];
}

function categoryKey(row: YearlyCategorySummary): string {
  return row.categoryId ?? "uncategorized";
}

function toCategoryTreeRows(rows: YearlyCategorySummary[]): YearlyCategorySummary[] {
  const nodes = new Map<string, YearlyCategoryTreeNode>();

  rows.forEach((row) => {
    nodes.set(categoryKey(row), { row, children: [] });
  });

  const roots: YearlyCategoryTreeNode[] = [];
  nodes.forEach((node) => {
    const parentPart = node.row.categoryPath[node.row.depth - 1];
    const parentNode = parentPart ? nodes.get(parentPart.id) : null;
    if (parentNode) parentNode.children.push(node);
    else roots.push(node);
  });

  const sortNodes = (items: YearlyCategoryTreeNode[]) => {
    items.sort((a, b) => b.row.amount - a.row.amount || a.row.categoryName.localeCompare(b.row.categoryName));
    items.forEach((item) => sortNodes(item.children));
  };
  sortNodes(roots);

  const flattened: YearlyCategorySummary[] = [];
  const visit = (node: YearlyCategoryTreeNode) => {
    flattened.push(node.row);
    node.children.forEach(visit);
  };
  roots.forEach(visit);
  return flattened;
}

function CategorySpendTable({
  rows,
  totalExpenses,
  isLoading,
}: {
  rows: YearlyCategorySummary[];
  totalExpenses: number;
  isLoading: boolean;
}) {
  const treeRows = useMemo(() => toCategoryTreeRows(rows), [rows]);

  return (
    <Paper variant="outlined" sx={{ borderRadius: 1, overflow: "hidden", mb: 2, borderColor: "rgba(255,255,255,0.08)", bgcolor: "rgba(32,35,45,0.92)" }}>
      <Box sx={{ px: 1.5, py: 1.25, borderBottom: "1px solid", borderColor: "divider", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Typography variant="h5" sx={{ fontWeight: 900, color: "text.primary" }}>Yearly spend by category</Typography>
        <Typography variant="caption" color="text.secondary">{treeRows.length} categories</Typography>
      </Box>
      <TableContainer sx={{ maxHeight: 520 }}>
        <Table stickyHeader size="small" sx={{ minWidth: 720 }}>
          <TableHead>
            <TableRow>
              <TableCell>Category</TableCell>
              <TableCell align="right" sx={{ width: 140 }}>Amount</TableCell>
              <TableCell align="right" sx={{ width: 100 }}>Txns</TableCell>
              <TableCell align="right" sx={{ width: 100 }}>%</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 6 }, (_, index) => (
                <TableRow key={index}>
                  <TableCell colSpan={4}><Skeleton height={28} /></TableCell>
                </TableRow>
              ))
            ) : treeRows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4}>
                  <Typography color="text.secondary" sx={{ py: 3, textAlign: "center" }}>
                    No expenses imported for this year.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              treeRows.map((row) => (
                <TableRow key={row.categoryId ?? "uncategorized"} hover>
                  <TableCell sx={{ fontWeight: row.depth === 0 ? 850 : 650, pl: 1 + row.depth * 2.25 }}>
                    {row.categoryName}
                  </TableCell>
                  <TableCell align="right" sx={{ color: "primary.main", fontWeight: 800 }}>{currency(row.amount)}</TableCell>
                  <TableCell align="right">{row.count}</TableCell>
                  <TableCell align="right">{totalExpenses > 0 ? `${((row.amount / totalExpenses) * 100).toFixed(1)}%` : "0%"}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
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
  const categorySpend = data?.categorySpend ?? [];
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

      <CategorySpendTable
        rows={categorySpend}
        totalExpenses={data?.totals.expenses ?? 0}
        isLoading={yearlyQuery.isLoading}
      />

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, lg: 6 }}>
          {yearlyQuery.isLoading ? <ChartSkeleton title="Monthly income vs expenses" /> : <IncomeExpenseChart months={months} />}
        </Grid>
        <Grid size={{ xs: 12, lg: 6 }}>
          {yearlyQuery.isLoading ? <ChartSkeleton title="Ending account balance" /> : <BalanceTrendChart months={months} />}
        </Grid>
        <Grid size={{ xs: 12 }}>
          {yearlyQuery.isLoading ? <ChartSkeleton title="Balance vs monthly cashflow" /> : <BalanceCashflowComboChart months={months} />}
        </Grid>
      </Grid>
    </Box>
  );
}
