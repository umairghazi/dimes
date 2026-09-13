import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Alert,
  Box,
  Button,
  Grid,
  IconButton,
  InputAdornment,
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
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
import { financeApi, FinanceCategory, MonthlyPlan } from "@/api/finance.api";
import { Expense } from "@/types/expense.types";
import { useMonthStore, isCurrentMonthYear } from "@/store/monthStore";

interface SummaryRow {
  category: string;
  planned: number;
  actual: number;
  diff: number;
}

interface BreakdownRow {
  id?: string;
  label: string;
  amount: number;
  percent: number;
  count?: number;
  hasChildren?: boolean;
}

interface CategorySpendNode {
  id: string;
  label: string;
  amount: number;
  count: number;
  children: CategorySpendNode[];
  depth: number;
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

function formatAxisDate(value: string): string {
  const date = new Date(`${value.slice(0, 10)}T00:00:00`);
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
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

function toDateOnly(value: string): Date {
  const [year, month, day] = value.slice(0, 10).split("-").map(Number);
  return new Date(year, month - 1, day);
}

function toIsoDate(value: Date): string {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addDays(value: Date, days: number): Date {
  const next = new Date(value);
  next.setDate(next.getDate() + days);
  return next;
}

function spendByDate(transactions: Expense[], monthYear: string): BreakdownRow[] {
  const expenseRows = transactions.filter((row) => row.type === "expense");
  if (expenseRows.length === 0) return [];

  const grouped = new Map<string, number>();
  const counts = new Map<string, number>();
  expenseRows.forEach((row) => {
    const key = row.date.slice(0, 10);
    grouped.set(key, (grouped.get(key) ?? 0) + row.amount);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  });

  const [year, month] = monthYear.split("-").map(Number);
  let start = new Date(year, month - 1, 1);
  let end = new Date(year, month, 0);
  [...grouped.keys()].forEach((date) => {
    const value = toDateOnly(date);
    if (value < start) start = value;
    if (value > end) end = value;
  });

  const totalSpent = [...grouped.values()].reduce((sum, value) => sum + value, 0);
  const rows: BreakdownRow[] = [];
  for (let cursor = start; cursor <= end; cursor = addDays(cursor, 1)) {
    const label = toIsoDate(cursor);
    const amount = grouped.get(label) ?? 0;
    rows.push({
      label,
      amount,
      count: counts.get(label) ?? 0,
      percent: totalSpent > 0 ? (amount / totalSpent) * 100 : 0,
    });
  }

  return rows;
}

function buildCategorySpendTree(transactions: Expense[], categories: FinanceCategory[]): CategorySpendNode[] {
  const categoryById = new Map(categories.map((category) => [category.id, category]));
  const nodeById = new Map<string, CategorySpendNode>();

  const ensureNode = (category: FinanceCategory): CategorySpendNode => {
    const existing = nodeById.get(category.id);
    if (existing) return existing;

    const node: CategorySpendNode = {
      id: category.id,
      label: category.name,
      amount: 0,
      count: 0,
      children: [],
      depth: category.depth,
    };
    nodeById.set(category.id, node);

    if (category.parentId) {
      const parent = categoryById.get(category.parentId);
      if (parent) ensureNode(parent).children.push(node);
    }

    return node;
  };

  categories.filter((category) => category.type === "expense").forEach(ensureNode);

  const uncategorized: CategorySpendNode = {
    id: "uncategorized",
    label: "Uncategorized",
    amount: 0,
    count: 0,
    children: [],
    depth: 0,
  };

  transactions.filter((row) => row.type === "expense").forEach((row) => {
    const category = row.categoryId ? categoryById.get(row.categoryId) : null;
    if (!category) {
      uncategorized.amount += row.amount;
      uncategorized.count += 1;
      return;
    }

    category.path.forEach((part) => {
      const node = nodeById.get(part.id);
      if (node) {
        node.amount += row.amount;
        node.count += 1;
      }
    });
  });

  const roots = categories
    .filter((category) => category.type === "expense" && !category.parentId)
    .map((category) => nodeById.get(category.id))
    .filter((node): node is CategorySpendNode => Boolean(node));

  if (uncategorized.amount > 0) roots.push(uncategorized);

  const sortNodes = (nodes: CategorySpendNode[]): CategorySpendNode[] => {
    nodes.sort((a, b) => b.amount - a.amount || a.label.localeCompare(b.label));
    nodes.forEach((node) => sortNodes(node.children));
    return nodes;
  };

  return sortNodes(roots);
}

function findCategoryNode(nodes: CategorySpendNode[], id: string | null): CategorySpendNode | null {
  if (!id) return null;
  for (const node of nodes) {
    if (node.id === id) return node;
    const child = findCategoryNode(node.children, id);
    if (child) return child;
  }
  return null;
}

function drilldownRows(nodes: CategorySpendNode[], activeId: string | null): BreakdownRow[] {
  const active = findCategoryNode(nodes, activeId);
  const rows = active ? active.children : nodes;
  const totalAmount = rows.reduce((sum, row) => sum + row.amount, 0);
  return rows
    .filter((row) => row.amount > 0)
    .map((row) => ({
      id: row.id,
      label: row.label,
      amount: row.amount,
      count: row.count,
      hasChildren: row.children.some((child) => child.amount > 0),
      percent: totalAmount > 0 ? (row.amount / totalAmount) * 100 : 0,
    }));
}

function visibleTreeRows(nodes: CategorySpendNode[], expanded: Set<string>): CategorySpendNode[] {
  const rows: CategorySpendNode[] = [];
  const visit = (node: CategorySpendNode) => {
    if (node.amount <= 0) return;
    rows.push(node);
    if (expanded.has(node.id)) node.children.forEach(visit);
  };
  nodes.forEach(visit);
  return rows;
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
  const [tooltip, setTooltip] = useState<{ row: BreakdownRow; x: number; y: number } | null>(null);
  const max = Math.max(...rows.map((row) => row.amount), 1);
  const width = 920;
  const height = 280;
  const left = 72;
  const right = 24;
  const top = 32;
  const bottom = 46;
  const plotWidth = width - left - right;
  const plotHeight = height - top - bottom;
  const bandWidth = plotWidth / Math.max(rows.length, 1);
  const barWidth = Math.min(32, Math.max(6, bandWidth * 0.56));
  const labelEvery = rows.length <= 16 ? 2 : 7;
  const ticks = [0, 0.5, 1];
  const tooltipWidth = 188;
  const tooltipHeight = 76;

  const tooltipX = tooltip ? Math.min(Math.max(tooltip.x + 12, left), width - right - tooltipWidth) : 0;
  const tooltipY = tooltip ? Math.max(top, tooltip.y - tooltipHeight - 12) : 0;

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
            const x = left + bandWidth * index + bandWidth / 2;
            const barHeight = (row.amount / max) * plotHeight;
            const barTop = top + plotHeight - barHeight;
            const showLabel = index === 0 || index === rows.length - 1 || index % labelEvery === 0;
            return (
              <g key={row.label}>
                <rect x={x - barWidth / 2} y={barTop} width={barWidth} height={barHeight} fill="#ff6b2c" rx="4" />
                <rect
                  x={left + bandWidth * index}
                  y={top}
                  width={bandWidth}
                  height={plotHeight}
                  fill="transparent"
                  onMouseMove={() => setTooltip({ row, x, y: Math.max(barTop, top + 18) })}
                  onMouseLeave={() => setTooltip(null)}
                />
                {showLabel && <text x={x} y={height - 24} textAnchor="middle" fontSize="12" fill="#b5bbcb">{formatAxisDate(row.label)}</text>}
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
              <text x={tooltipX + 12} y={tooltipY + 22} fontSize="13" fontWeight="800" fill="#f7f8fc">
                {formatShortDate(tooltip.row.label)}
              </text>
              <text x={tooltipX + 12} y={tooltipY + 43} fontSize="13" fontWeight="800" fill="#ff875c">
                {currencyWithCents(tooltip.row.amount)}
              </text>
              <text x={tooltipX + 12} y={tooltipY + 62} fontSize="12" fill="#b5bbcb">
                {tooltip.row.count ?? 0} txns · {tooltip.row.percent.toFixed(1)}% of spend
              </text>
            </g>
          )}
          <text x={18} y={top + plotHeight / 2} transform={`rotate(-90 18 ${top + plotHeight / 2})`} textAnchor="middle" fontSize="13" fontWeight="700" fill="#b5bbcb">Amount</text>
          <text x={left + plotWidth / 2} y={height - 4} textAnchor="middle" fontSize="13" fontWeight="700" fill="#b5bbcb">Date</text>
        </Box>
      )}
    </Paper>
  );
}

function BreakdownChart({
  title,
  rows,
  activeLabel,
  onSelect,
  onBack,
}: {
  title: string;
  rows: BreakdownRow[];
  activeLabel?: string | null;
  onSelect?: (row: BreakdownRow) => void;
  onBack?: () => void;
}) {
  const [tooltip, setTooltip] = useState<{ row: BreakdownRow; x: number; y: number } | null>(null);
  let cursor = 0;
  const slices = rows.map((row) => {
    const start = cursor;
    cursor += row.percent;
    return { row, start, end: cursor };
  });
  const gradient = rows.length === 0
    ? "#e5e7eb"
    : slices.map(({ start, end }, index) => `${chartColors[index % chartColors.length]} ${start}% ${end}%`).join(", ");

  const updateTooltip = (event: React.MouseEvent<HTMLDivElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - bounds.left;
    const y = event.clientY - bounds.top;
    const centerX = bounds.width / 2;
    const centerY = bounds.height / 2;
    const distance = Math.hypot(x - centerX, y - centerY);
    if (distance > bounds.width / 2) {
      setTooltip(null);
      return;
    }

    const degrees = (Math.atan2(y - centerY, x - centerX) * 180) / Math.PI;
    const percent = ((degrees + 450) % 360) / 360 * 100;
    const slice = slices.find(({ start, end }) => percent >= start && percent <= end);
    setTooltip(slice ? { row: slice.row, x, y } : null);
  };

  return (
    <Paper variant="outlined" sx={{ borderRadius: 1, p: 2, height: "100%", borderColor: "rgba(255,255,255,0.08)", bgcolor: "rgba(32,35,45,0.92)" }}>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2, mb: 2 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 900, color: "text.primary" }}>{title}</Typography>
          {activeLabel && <Typography variant="caption" color="text.secondary">Viewing {activeLabel}</Typography>}
        </Box>
        {activeLabel && (
          <Typography component="button" onClick={onBack} sx={{ border: 0, bgcolor: "transparent", color: "primary.main", fontWeight: 800, cursor: "pointer" }}>
            Back
          </Typography>
        )}
      </Box>
      {rows.length === 0 ? (
        <Typography color="text.secondary">No category spend for this view.</Typography>
      ) : (
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "240px 1fr" }, gap: 2, alignItems: "center" }}>
          <Box sx={{ position: "relative", width: 240, height: 240, justifySelf: "center" }}>
            <Box
              onMouseMove={updateTooltip}
              onMouseLeave={() => setTooltip(null)}
              sx={{
                width: 240,
                height: 240,
                borderRadius: "50%",
                background: `conic-gradient(${gradient})`,
                cursor: "crosshair",
              }}
            />
            {tooltip && (
              <Box
                sx={{
                  position: "absolute",
                  left: tooltip.x,
                  top: tooltip.y,
                  transform: "translate(12px, -50%)",
                  zIndex: 2,
                  minWidth: 168,
                  p: 1,
                  border: "1px solid rgba(255,255,255,0.12)",
                  borderRadius: 1,
                  bgcolor: "rgba(15,17,23,0.96)",
                  boxShadow: "0 16px 34px rgba(0,0,0,0.32)",
                  pointerEvents: "none",
                }}
              >
                <Typography variant="body2" sx={{ fontWeight: 900 }}>{tooltip.row.label}</Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.25 }}>
                  {currencyWithCents(tooltip.row.amount)} · {tooltip.row.percent.toFixed(1)}%
                </Typography>
              </Box>
            )}
          </Box>
          <Box sx={{ display: "grid", gap: 0.75 }}>
            {rows.slice(0, 10).map((row, index) => (
              <Box
                key={row.label}
                onClick={() => row.hasChildren && onSelect?.(row)}
                sx={{
                  display: "grid",
                  gridTemplateColumns: "14px 1fr auto",
                  gap: 1,
                  alignItems: "center",
                  py: 0.35,
                  cursor: row.hasChildren ? "pointer" : "default",
                }}
              >
                <Box sx={{ width: 10, height: 10, bgcolor: chartColors[index % chartColors.length] }} />
                <Typography variant="body2" sx={{ fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {row.hasChildren ? `${row.label} >` : row.label}
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

function decimalInput(value: number | null | undefined): string {
  return value === null || value === undefined ? "" : String(value);
}

function parseMoneyInput(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed.replace(/[$,\s]/g, ""));
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

function BalanceEditor({
  month,
  balance,
  calculatedEndingBalance,
  isLoading,
  isSaving,
  onSave,
}: {
  month: string;
  balance: { startingBalance: number; endingBalance: number | null; currency: string } | null | undefined;
  calculatedEndingBalance: number;
  isLoading: boolean;
  isSaving: boolean;
  onSave: (data: { startingBalance: number; endingBalance: number | null; currency: string }) => Promise<void>;
}) {
  const [starting, setStarting] = useState("");
  const [ending, setEnding] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setStarting(decimalInput(balance?.startingBalance ?? 0));
    setEnding(decimalInput(balance?.endingBalance));
    setError(null);
  }, [balance?.startingBalance, balance?.endingBalance, month]);

  const save = async () => {
    const startingBalance = parseMoneyInput(starting);
    const endingBalance = parseMoneyInput(ending);
    if (startingBalance === null) {
      setError("Enter a valid starting balance.");
      return;
    }
    if (ending.trim() && endingBalance === null) {
      setError("Enter a valid ending balance, or leave it blank.");
      return;
    }

    setError(null);
    await onSave({
      startingBalance,
      endingBalance: ending.trim() ? endingBalance : null,
      currency: balance?.currency ?? "CAD",
    });
  };

  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2,
        my: 2,
        borderRadius: 1,
        borderColor: "rgba(255,255,255,0.08)",
        bgcolor: "rgba(32,35,45,0.92)",
      }}
    >
      <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 2, flexWrap: "wrap", mb: 1.5 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 900 }}>Account balances</Typography>
          <Typography variant="body2" color="text.secondary">
            Leave ending balance blank to calculate it from starting balance, income, and expenses.
          </Typography>
        </Box>
        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800, pt: 0.4 }}>
          Calculated end: {currency(calculatedEndingBalance)}
        </Typography>
      </Box>

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr auto" }, gap: 1.5, alignItems: "start" }}>
        <TextField
          label="Starting balance"
          type="number"
          size="small"
          value={starting}
          disabled={isLoading || isSaving}
          onChange={(event) => setStarting(event.target.value)}
          slotProps={{
            input: { startAdornment: <InputAdornment position="start">$</InputAdornment> },
            htmlInput: { min: 0, step: "0.01" },
          }}
        />
        <TextField
          label="Ending balance"
          type="number"
          size="small"
          value={ending}
          disabled={isLoading || isSaving}
          onChange={(event) => setEnding(event.target.value)}
          placeholder={calculatedEndingBalance.toFixed(2)}
          slotProps={{
            input: { startAdornment: <InputAdornment position="start">$</InputAdornment> },
            htmlInput: { min: 0, step: "0.01" },
          }}
        />
        <Button
          variant="contained"
          startIcon={<SaveOutlinedIcon />}
          disabled={isLoading || isSaving}
          onClick={() => void save()}
          sx={{ minHeight: 40 }}
        >
          {isSaving ? "Saving..." : "Save"}
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mt: 1.5 }}>
          {error}
        </Alert>
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

function CategoryTreeTable({
  nodes,
  expanded,
  onToggle,
}: {
  nodes: CategorySpendNode[];
  expanded: Set<string>;
  onToggle: (id: string) => void;
}) {
  const rows = visibleTreeRows(nodes, expanded);
  const totalAmount = nodes.reduce((sum, node) => sum + node.amount, 0);

  return (
    <Paper variant="outlined" sx={{ borderRadius: 1, overflow: "hidden", borderColor: "rgba(255,255,255,0.08)", bgcolor: "rgba(32,35,45,0.92)" }}>
      <Box sx={{ px: 1.5, py: 1.25, borderBottom: "1px solid", borderColor: "divider", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Typography variant="h5" sx={{ fontWeight: 900, color: "primary.main" }}>Category Breakdown</Typography>
        <Typography variant="caption" color="text.secondary">{rows.length} visible</Typography>
      </Box>
      <TableContainer sx={{ maxHeight: "calc(100vh - 360px)" }}>
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow>
              <TableCell>Category</TableCell>
              <TableCell align="right" sx={{ width: 130 }}>Amount</TableCell>
              <TableCell align="right" sx={{ width: 110 }}>Txns</TableCell>
              <TableCell align="right" sx={{ width: 110 }}>%</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            <TableRow sx={{ bgcolor: "action.hover" }}>
              <TableCell sx={{ fontWeight: 800 }}>Total</TableCell>
              <TableCell align="right" sx={{ fontWeight: 800 }}>{currency(totalAmount)}</TableCell>
              <TableCell align="right" sx={{ fontWeight: 800 }}>{nodes.reduce((sum, node) => sum + node.count, 0)}</TableCell>
              <TableCell align="right" sx={{ fontWeight: 800 }}>100%</TableCell>
            </TableRow>
            {rows.map((row) => {
              const hasChildren = row.children.some((child) => child.amount > 0);
              return (
                <TableRow key={row.id} hover>
                  <TableCell sx={{ fontWeight: 650, pl: 1 + row.depth * 2.2 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                      {hasChildren ? (
                        <Typography component="button" onClick={() => onToggle(row.id)} sx={{ border: 0, bgcolor: "transparent", color: "text.secondary", cursor: "pointer", fontWeight: 900, width: 20 }}>
                          {expanded.has(row.id) ? "-" : "+"}
                        </Typography>
                      ) : (
                        <Box sx={{ width: 20 }} />
                      )}
                      <span>{row.label}</span>
                    </Box>
                  </TableCell>
                  <TableCell align="right">{currency(row.amount)}</TableCell>
                  <TableCell align="right">{row.count}</TableCell>
                  <TableCell align="right">{totalAmount > 0 ? `${((row.amount / totalAmount) * 100).toFixed(1)}%` : "0%"}</TableCell>
                </TableRow>
              );
            })}
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
  const queryClient = useQueryClient();
  const { month, prevMonth, nextMonth } = useMonthStore();
  const isCurrentMonth = isCurrentMonthYear(month);
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(() => new Set());

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

  const categoriesQuery = useQuery({
    queryKey: ["finance", "categories"],
    queryFn: () => financeApi.categories({ type: "expense" }),
  });

  const balanceMutation = useMutation({
    mutationFn: financeApi.upsertMonthlyBalance,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["finance", "balance", month] });
      queryClient.invalidateQueries({ queryKey: ["finance", "summary", month] });
    },
  });

  const transactions = transactionsQuery.data?.data ?? [];
  const categories = categoriesQuery.data ?? [];
  const plans = plansQuery.data ?? [];
  const expenseRows = useMemo(() => buildRows(transactions, plans, "expense"), [transactions, plans]);
  const incomeRows = useMemo(() => buildRows(transactions, plans, "income"), [transactions, plans]);
  const totalSpend = total(transactions, "expense");
  const totalIncome = total(transactions, "income");
  const netSavings = totalIncome - totalSpend;
  const startingBalance = balanceQuery.data?.startingBalance ?? 0;
  const calculatedEndingBalance = startingBalance + netSavings;
  const endingBalance = balanceQuery.data?.endingBalance ?? calculatedEndingBalance;
  const plannedSpend = expenseRows.reduce((sum, row) => sum + row.planned, 0);
  const dailySpend = useMemo(() => spendByDate(transactions, month), [transactions, month]);
  const categoryTree = useMemo(() => buildCategorySpendTree(transactions, categories), [transactions, categories]);
  const activeCategory = useMemo(() => findCategoryNode(categoryTree, activeCategoryId), [categoryTree, activeCategoryId]);
  const categorySpend = useMemo(() => drilldownRows(categoryTree, activeCategoryId), [categoryTree, activeCategoryId]);
  const toggleCategory = (id: string) => {
    setExpandedCategories((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

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
      {categoriesQuery.isError && <Alert severity="error" sx={{ mb: 2 }}>Failed to load categories</Alert>}

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

      <BalanceEditor
        month={month}
        balance={balanceQuery.data}
        calculatedEndingBalance={calculatedEndingBalance}
        isLoading={balanceQuery.isLoading}
        isSaving={balanceMutation.isPending}
        onSave={async (data) => {
          await balanceMutation.mutateAsync({ monthYear: month, ...data });
        }}
      />

      {balanceMutation.isError && <Alert severity="error" sx={{ mb: 2 }}>Failed to save account balances</Alert>}

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
        <Grid size={{ xs: 12, lg: 5 }}>
          {transactionsQuery.isLoading || categoriesQuery.isLoading ? (
            <ChartSkeleton title="Category drilldown" />
          ) : (
            <BreakdownChart
              title="Category drilldown"
              rows={categorySpend}
              activeLabel={activeCategory?.label ?? null}
              onSelect={(row) => row.id && setActiveCategoryId(row.id)}
              onBack={() => setActiveCategoryId(null)}
            />
          )}
        </Grid>
        <Grid size={{ xs: 12, lg: 7 }}>
          {transactionsQuery.isLoading || categoriesQuery.isLoading ? (
            <BudgetTableSkeleton title="Category Breakdown" type="expense" />
          ) : (
            <CategoryTreeTable nodes={categoryTree} expanded={expandedCategories} onToggle={toggleCategory} />
          )}
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
