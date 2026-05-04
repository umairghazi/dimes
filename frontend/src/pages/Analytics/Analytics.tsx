import { useState } from "react";
import {
  Box, Grid, Typography, Alert, IconButton, Skeleton,
  Tooltip, CircularProgress,
} from "@mui/material";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import RefreshIcon from "@mui/icons-material/Refresh";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import { useAnalytics } from "@/hooks/useAnalytics";
import { useCategories } from "@/hooks/useCategories";
import { TrendLine } from "@/components/charts/TrendLine";
import { BudgetRebalancer } from "@/components/dashboard/BudgetRebalancer";
import { CategoryBudgetTable } from "@/components/budget/CategoryBudgetTable";
import { CollapsibleCard } from "@/components/shared/CollapsibleCard";
import { DrillDownDrawer, DrillDown } from "@/components/expenses/DrillDownDrawer";
import { BalanceStrip } from "@/components/analytics/BalanceStrip";
import { FixedVariableCard } from "@/components/analytics/FixedVariableCard";
import {
  ParetoCard, MoMCard, TopMerchantsCard,
  BudgetRecommendationsCard,
} from "@/components/analytics/SpendingInsights";
import { useBreakpoint } from "@/hooks/useBreakpoint";

function formatMonthLabel(monthYear: string): string {
  const [year, month] = monthYear.split("-").map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });
}

function getPrevMonthYear(monthYear: string): string {
  const [year, month] = monthYear.split("-").map(Number);
  const d = new Date(year, month - 2, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function SectionLabel({ children }: { children: string }) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 2, mt: 4, mb: 2.5 }}>
      <Typography
        variant="overline"
        sx={{
          fontWeight: 700,
          color: "text.secondary",
          letterSpacing: 1.5,
          lineHeight: 1,
          whiteSpace: "nowrap",
        }}
      >
        {children}
      </Typography>
      <Box sx={{ flex: 1, height: "1px", bgcolor: "divider" }} />
    </Box>
  );
}

export function Analytics() {
  const {
    month, prevMonth, nextMonth, isCurrentMonth,
    summary, trends, comparison,
    loading, error,
    insight, insightLoading, insightError, refreshInsight,
    merchants,
  } = useAnalytics();

  const { categories } = useCategories();
  const { isMobile } = useBreakpoint();
  const prevSummary = trends.find((t) => t.period === getPrevMonthYear(month)) ?? null;
  const spentMap = new Map<string, number>(
    (summary?.byCategory ?? []).map((c) => [c.category, c.amount]),
  );

  const [drillDown, setDrillDown] = useState<DrillDown | null>(null);
  const openDrillDown = (category?: string, overrideMonth?: string) =>
    setDrillDown({ category, month: overrideMonth ?? month });
  const closeDrillDown = () => setDrillDown(null);

  if (error) return <Alert severity="error" sx={{ m: 3 }}>{error}</Alert>;

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1100, mx: "auto" }}>

      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 800 }}>Analytics</Typography>
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

      {/* ── Monthly Statement ─────────────────────────────────── */}
      <BalanceStrip monthYear={month} summary={summary} loading={loading} />

      {/* ── Where it went ────────────────────────────────────── */}
      <SectionLabel>Where it went</SectionLabel>

      {loading ? (
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 7 }}><Skeleton variant="rectangular" height={280} sx={{ borderRadius: 2 }} /></Grid>
          <Grid size={{ xs: 12, md: 5 }}><Skeleton variant="rectangular" height={280} sx={{ borderRadius: 2 }} /></Grid>
        </Grid>
      ) : summary && summary.byCategory.length > 0 && (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 7 }}>
              <ParetoCard
                categories={summary.byCategory}
                totalSpend={summary.totalSpend}
                onCategoryClick={(c) => openDrillDown(c)}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 5 }}>
              {prevSummary ? (
                <MoMCard
                  current={summary}
                  previous={prevSummary}
                  onCategoryClick={(c) => openDrillDown(c)}
                />
              ) : (
                <Box sx={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Typography variant="body2" color="text.disabled">
                    No previous month to compare
                  </Typography>
                </Box>
              )}
            </Grid>
          </Grid>

          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 6 }}>
              <TopMerchantsCard merchants={merchants} totalSpend={summary.totalSpend} />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <FixedVariableCard
                summary={summary}
                categories={categories}
                onCategoryClick={(c) => openDrillDown(c)}
              />
            </Grid>
          </Grid>
        </Box>
      )}

      {/* ── Budget ───────────────────────────────────────────── */}
      <SectionLabel>Budget</SectionLabel>

      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {summary && comparison && (
          <BudgetRecommendationsCard
            summary={summary}
            trends={trends}
            comparison={comparison}
            monthYear={month}
          />
        )}

        <CategoryBudgetTable spentMap={spentMap} />

        {comparison && isCurrentMonth && (
          <CollapsibleCard
            storageKey="analytics-rebalancer"
            defaultOpen={false}
            sx={{ borderLeft: 4, borderColor: "warning.main" }}
            title={
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <WarningAmberIcon color="warning" fontSize="small" />
                <Typography variant="h6" sx={{ fontWeight: 700 }}>Budget Rebalancer</Typography>
              </Box>
            }
          >
            <BudgetRebalancer comparison={comparison} isCurrentMonth={isCurrentMonth} />
          </CollapsibleCard>
        )}
      </Box>

      {/* ── Over time ────────────────────────────────────────── */}
      <SectionLabel>Over time</SectionLabel>

      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {loading ? (
          <Skeleton variant="rectangular" height={220} sx={{ borderRadius: 2 }} />
        ) : (
          <TrendLine
            data={trends}
            height={isMobile ? 180 : 220}
            onMonthClick={(m) => openDrillDown(undefined, m)}
          />
        )}

        <CollapsibleCard
          storageKey="analytics-insight"
          defaultOpen={false}
          title={
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <AutoAwesomeIcon fontSize="small" color="primary" />
              <Typography variant="h6" sx={{ fontWeight: 700 }}>AI Insight</Typography>
            </Box>
          }
          action={
            <Tooltip title={insight ? "Regenerate" : "Generate"}>
              <span>
                <IconButton size="small" onClick={() => void refreshInsight()} disabled={insightLoading}>
                  {insightLoading ? <CircularProgress size={16} /> : <RefreshIcon fontSize="small" />}
                </IconButton>
              </span>
            </Tooltip>
          }
        >
          {insightError ? (
            <Typography variant="body2" color="text.disabled">{insightError}</Typography>
          ) : insight ? (
            <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.7 }}>
              {insight}
            </Typography>
          ) : (
            <Typography variant="body2" color="text.disabled">
              Click refresh to generate an AI insight for this month.
            </Typography>
          )}
        </CollapsibleCard>
      </Box>

      <DrillDownDrawer open={drillDown !== null} onClose={closeDrillDown} drillDown={drillDown} />
    </Box>
  );
}
