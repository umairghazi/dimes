import { useMemo, useState } from "react";
import { Box, Card, CardContent, Typography, Grid, LinearProgress, Chip, Button, CircularProgress } from "@mui/material";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import StorefrontIcon from "@mui/icons-material/Storefront";
import LightbulbOutlinedIcon from "@mui/icons-material/LightbulbOutlined";
import { useQueryClient } from "@tanstack/react-query";
import { MonthlySummary, CategorySummary, MerchantTotal, BudgetComparison } from "@/types/analytics.types";
import { useBudgets } from "@/hooks/useBudgets";
import { useCategories } from "@/hooks/useCategories";
import { FixedVariableCard } from "./FixedVariableCard";

interface Props {
  summary: MonthlySummary;
  prevSummary: MonthlySummary | null;
  trends: MonthlySummary[];
  comparison: BudgetComparison | null;
  merchants: MerchantTotal[];
  isCurrentMonth: boolean;
  monthYear: string;
  onCategoryClick: (category: string) => void;
}

const COLORS = [
  "#6366f1", "#f59e0b", "#10b981", "#ef4444", "#3b82f6", "#8b5cf6", "#ec4899", "#14b8a6",
];

function fmt(n: number) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

function StatCard({ label, value, sub, color }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <Card variant="outlined" sx={{ height: "100%" }}>
      <CardContent sx={{ pb: "16px !important" }}>
        <Typography variant="caption" color="text.secondary" sx={{ textTransform: "uppercase", letterSpacing: 0.8, fontWeight: 600 }}>
          {label}
        </Typography>
        <Typography variant="h4" sx={{ fontWeight: 800, color: color ?? "text.primary", mt: 0.5, fontVariantNumeric: "tabular-nums" }}>
          {value}
        </Typography>
        {sub && (
          <Typography variant="caption" color="text.secondary">
            {sub}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}

function ParetoCard({ categories, totalSpend, onCategoryClick }: {
  categories: CategorySummary[];
  totalSpend: number;
  onCategoryClick: (c: string) => void;
}) {
  const sorted = useMemo(() => [...categories].sort((a, b) => b.amount - a.amount), [categories]);

  const { keyCategories, keyPercent } = useMemo(() => {
    const threshold = totalSpend * 0.8;
    let cum = 0;
    const key: CategorySummary[] = [];
    for (const cat of sorted) {
      key.push(cat);
      cum += cat.amount;
      if (cum >= threshold) break;
    }
    return { keyCategories: key, keyPercent: (cum / totalSpend) * 100 };
  }, [sorted, totalSpend]);

  return (
    <Card variant="outlined">
      <CardContent>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>Where your money went</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {keyCategories.length} {keyCategories.length === 1 ? "category" : "categories"} account for{" "}
          <Box component="span" sx={{ fontWeight: 700, color: "text.primary" }}>
            {keyPercent.toFixed(0)}%
          </Box>{" "}
          of spending
        </Typography>

        {/* Stacked bar */}
        <Box sx={{ display: "flex", height: 10, borderRadius: 5, overflow: "hidden", mb: 2.5 }}>
          {sorted.map((cat, i) => (
            <Box
              key={cat.category}
              sx={{
                width: `${(cat.amount / totalSpend) * 100}%`,
                bgcolor: COLORS[i % COLORS.length],
                cursor: "pointer",
                transition: "opacity 0.15s",
                "&:hover": { opacity: 0.75 },
              }}
              onClick={() => onCategoryClick(cat.category)}
            />
          ))}
        </Box>

        {/* Category rows */}
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.25 }}>
          {sorted.slice(0, 7).map((cat, i) => {
            const pct = (cat.amount / totalSpend) * 100;
            return (
              <Box
                key={cat.category}
                sx={{ display: "flex", alignItems: "center", gap: 1, cursor: "pointer", "&:hover .cat-name": { color: "primary.main" } }}
                onClick={() => onCategoryClick(cat.category)}
              >
                <Box sx={{ width: 10, height: 10, borderRadius: "2px", bgcolor: COLORS[i % COLORS.length], flexShrink: 0 }} />
                <Typography
                  className="cat-name"
                  variant="body2"
                  sx={{ flex: 1, transition: "color 0.15s", fontWeight: i < keyCategories.length ? 600 : 400 }}
                >
                  {cat.category}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontVariantNumeric: "tabular-nums", minWidth: 36, textAlign: "right" }}>
                  {pct.toFixed(0)}%
                </Typography>
                <Typography variant="body2" sx={{ fontVariantNumeric: "tabular-nums", minWidth: 72, textAlign: "right", fontWeight: 600 }}>
                  {fmt(cat.amount)}
                </Typography>
              </Box>
            );
          })}
          {sorted.length > 7 && (
            <Typography variant="caption" color="text.secondary" sx={{ pl: 2.5 }}>
              +{sorted.length - 7} more categories
            </Typography>
          )}
        </Box>
      </CardContent>
    </Card>
  );
}

function MoMCard({ current, previous, onCategoryClick }: {
  current: MonthlySummary;
  previous: MonthlySummary;
  onCategoryClick: (c: string) => void;
}) {
  const deltas = useMemo(() => {
    const prevMap = new Map(previous.byCategory.map((c) => [c.category, c.amount]));
    return current.byCategory
      .map((c) => ({
        category: c.category,
        amount: c.amount,
        delta: c.amount - (prevMap.get(c.category) ?? 0),
        isNew: !prevMap.has(c.category),
      }))
      .filter((c) => Math.abs(c.delta) > 0.5)
      .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
      .slice(0, 7);
  }, [current, previous]);

  if (deltas.length === 0) return null;

  return (
    <Card variant="outlined">
      <CardContent>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>vs last month</Typography>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.25 }}>
          {deltas.map((d) => {
            const up = d.delta > 0;
            const Icon = up ? TrendingUpIcon : TrendingDownIcon;
            const deltaColor = up ? "error.main" : "success.main";
            return (
              <Box
                key={d.category}
                sx={{ display: "flex", alignItems: "center", gap: 1, cursor: "pointer", "&:hover .cat-name": { color: "primary.main" } }}
                onClick={() => onCategoryClick(d.category)}
              >
                <Icon sx={{ fontSize: 18, color: deltaColor, flexShrink: 0 }} />
                <Typography className="cat-name" variant="body2" sx={{ flex: 1, transition: "color 0.15s" }}>
                  {d.category}
                </Typography>
                {d.isNew && (
                  <Typography variant="caption" sx={{ color: "text.disabled", fontStyle: "italic", mr: 0.5 }}>new</Typography>
                )}
                <Typography variant="body2" sx={{ color: deltaColor, fontWeight: 700, fontVariantNumeric: "tabular-nums", minWidth: 64, textAlign: "right" }}>
                  {up ? "+" : ""}{fmt(d.delta)}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontVariantNumeric: "tabular-nums", minWidth: 68, textAlign: "right" }}>
                  {fmt(d.amount)}
                </Typography>
              </Box>
            );
          })}
        </Box>
      </CardContent>
    </Card>
  );
}

function TopMerchantsCard({ merchants, totalSpend }: { merchants: MerchantTotal[]; totalSpend: number }) {
  if (merchants.length === 0) return null;
  const top = merchants.slice(0, 8);
  const maxTotal = top[0]?.total ?? 1;

  return (
    <Card variant="outlined">
      <CardContent>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
          <StorefrontIcon fontSize="small" color="action" />
          <Typography variant="h6" sx={{ fontWeight: 700 }}>Top merchants</Typography>
        </Box>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
          {top.map((m) => {
            const pct = totalSpend > 0 ? (m.total / totalSpend) * 100 : 0;
            return (
              <Box key={m.merchant}>
                <Box sx={{ display: "flex", alignItems: "baseline", gap: 1, mb: 0.4 }}>
                  <Typography variant="body2" sx={{ flex: 1, fontWeight: 500, textTransform: "capitalize" }}>
                    {m.merchant}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ fontVariantNumeric: "tabular-nums" }}>
                    {m.count}×
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700, fontVariantNumeric: "tabular-nums", minWidth: 68, textAlign: "right" }}>
                    {fmt(m.total)}
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={(m.total / maxTotal) * 100}
                  sx={{ height: 4, borderRadius: 2, bgcolor: "action.hover", "& .MuiLinearProgress-bar": { borderRadius: 2 } }}
                />
                <Typography variant="caption" color="text.secondary">{pct.toFixed(1)}% of spend</Typography>
              </Box>
            );
          })}
        </Box>
      </CardContent>
    </Card>
  );
}

function SpendingPaceCard({ summary, monthYear }: { summary: MonthlySummary; monthYear: string }) {
  const [year, month] = monthYear.split("-").map(Number);
  const today = new Date();
  const daysInMonth = new Date(year, month, 0).getDate();
  const daysElapsed = today.getDate();
  const daysRemaining = daysInMonth - daysElapsed;

  if (daysElapsed === 0) return null;

  const dailyRate = summary.totalSpend / daysElapsed;
  const projected = dailyRate * daysInMonth;
  const projectedSavings = summary.totalIncome > 0 ? summary.totalIncome - projected : null;
  const overage = summary.totalIncome > 0 ? projected - summary.totalIncome : null;
  const onTrack = overage === null || overage <= 0;

  return (
    <Card variant="outlined" sx={{ borderColor: onTrack ? "divider" : "warning.main", borderWidth: onTrack ? 1 : 2 }}>
      <CardContent>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1.5 }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>Spending pace</Typography>
          <Chip
            label={`${daysRemaining}d left`}
            size="small"
            variant="outlined"
            color={daysRemaining <= 7 ? "warning" : "default"}
          />
        </Box>
        <Grid container spacing={2}>
          <Grid size={{ xs: 6, sm: 3 }}>
            <Typography variant="caption" color="text.secondary" sx={{ textTransform: "uppercase", letterSpacing: 0.8, fontWeight: 600 }}>
              Daily avg
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>
              {fmt(dailyRate)}
            </Typography>
          </Grid>
          <Grid size={{ xs: 6, sm: 3 }}>
            <Typography variant="caption" color="text.secondary" sx={{ textTransform: "uppercase", letterSpacing: 0.8, fontWeight: 600 }}>
              Projected
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 700, fontVariantNumeric: "tabular-nums", color: onTrack ? "text.primary" : "warning.main" }}>
              {fmt(projected)}
            </Typography>
          </Grid>
          {projectedSavings !== null && (
            <Grid size={{ xs: 6, sm: 3 }}>
              <Typography variant="caption" color="text.secondary" sx={{ textTransform: "uppercase", letterSpacing: 0.8, fontWeight: 600 }}>
                {onTrack ? "Projected savings" : "Projected shortfall"}
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 700, fontVariantNumeric: "tabular-nums", color: onTrack ? "success.main" : "error.main" }}>
                {fmt(Math.abs(projectedSavings))}
              </Typography>
            </Grid>
          )}
          <Grid size={{ xs: 6, sm: 3 }}>
            <Typography variant="caption" color="text.secondary" sx={{ textTransform: "uppercase", letterSpacing: 0.8, fontWeight: 600 }}>
              Spent so far
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>
              {fmt(summary.totalSpend)}
            </Typography>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
}

function BudgetRecommendationsCard({ summary, trends, comparison, monthYear }: {
  summary: MonthlySummary;
  trends: MonthlySummary[];
  comparison: BudgetComparison | null;
  monthYear: string;
}) {
  const { createBudget } = useBudgets();
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState<string | null>(null);
  const [accepted, setAccepted] = useState<Set<string>>(new Set());

  const completedMonths = useMemo(
    () => trends.filter((t) => t.period !== monthYear).slice(-3),
    [trends, monthYear],
  );

  const recommendations = useMemo(() => {
    if (!comparison) return [];

    const budgeted = new Set(comparison.rows.filter((r) => r.planned > 0).map((r) => r.category));

    // Accumulate spend per category across all months (historical + current)
    const allMonths = [...completedMonths, summary];
    const totals = new Map<string, { total: number; count: number }>();
    for (const m of allMonths) {
      for (const c of m.byCategory) {
        if (budgeted.has(c.category) || accepted.has(c.category)) continue;
        const cur = totals.get(c.category) ?? { total: 0, count: 0 };
        totals.set(c.category, { total: cur.total + c.amount, count: cur.count + 1 });
      }
    }

    return Array.from(totals.entries())
      .map(([category, { total, count }]) => {
        const avg = total / count;
        return { category, avg, suggested: Math.ceil(avg / 25) * 25 };
      })
      .filter((r) => r.avg >= 10)
      .sort((a, b) => b.avg - a.avg)
      .slice(0, 6);
  }, [comparison, completedMonths, summary, accepted]);

  if (recommendations.length === 0) return null;

  const accept = async (category: string, amount: number) => {
    setSaving(category);
    try {
      await createBudget({ category, limitAmount: amount, monthYear });
      await queryClient.invalidateQueries({ queryKey: ["analytics"] });
      setAccepted((prev) => new Set([...prev, category]));
    } finally {
      setSaving(null);
    }
  };

  return (
    <Card variant="outlined" sx={{ borderColor: "primary.main", borderStyle: "dashed" }}>
      <CardContent>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
          <LightbulbOutlinedIcon fontSize="small" color="primary" />
          <Typography variant="h6" sx={{ fontWeight: 700 }}>Budget suggestions</Typography>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Based on your last {completedMonths.length} months — categories with no budget set
        </Typography>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.25 }}>
          {recommendations.map((r) => (
            <Box key={r.category} sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <Typography variant="body2" sx={{ flex: 1, fontWeight: 500 }}>{r.category}</Typography>
              <Typography variant="caption" color="text.secondary" sx={{ fontVariantNumeric: "tabular-nums" }}>
                avg {fmt(r.avg)}/mo
              </Typography>
              <Button
                size="small"
                variant="outlined"
                disabled={saving === r.category}
                onClick={() => void accept(r.category, r.suggested)}
                sx={{ minWidth: 90, fontVariantNumeric: "tabular-nums" }}
              >
                {saving === r.category
                  ? <CircularProgress size={14} />
                  : `Set ${fmt(r.suggested)}`}
              </Button>
            </Box>
          ))}
        </Box>
      </CardContent>
    </Card>
  );
}

export function SpendingInsights({ summary, prevSummary, trends, comparison, merchants, isCurrentMonth, monthYear, onCategoryClick }: Props) {
  const { categories } = useCategories();
  const savingsRate = summary.totalIncome > 0 ? (summary.netSavings / summary.totalIncome) * 100 : null;
  const savingsColor =
    savingsRate === null ? undefined
    : savingsRate >= 20 ? "success.main"
    : savingsRate >= 0 ? "warning.main"
    : "error.main";

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <StatCard
            label="Total Spent"
            value={fmt(summary.totalSpend)}
            sub={`across ${summary.byCategory.length} categories`}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <StatCard
            label="Savings Rate"
            value={savingsRate !== null ? `${savingsRate.toFixed(0)}%` : "—"}
            sub={savingsRate !== null ? `${fmt(summary.netSavings)} saved` : "No income recorded"}
            color={savingsColor}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <StatCard
            label="Total Income"
            value={fmt(summary.totalIncome)}
          />
        </Grid>
      </Grid>

      {isCurrentMonth && (
        <SpendingPaceCard summary={summary} monthYear={monthYear} />
      )}

      {isCurrentMonth && (
        <BudgetRecommendationsCard summary={summary} trends={trends} comparison={comparison} monthYear={monthYear} />
      )}

      {summary.byCategory.length > 0 && summary.totalSpend > 0 && (
        <ParetoCard
          categories={summary.byCategory}
          totalSpend={summary.totalSpend}
          onCategoryClick={onCategoryClick}
        />
      )}

      {prevSummary && (
        <MoMCard current={summary} previous={prevSummary} onCategoryClick={onCategoryClick} />
      )}

      <FixedVariableCard summary={summary} categories={categories} onCategoryClick={onCategoryClick} />

      <TopMerchantsCard merchants={merchants} totalSpend={summary.totalSpend} />
    </Box>
  );
}
