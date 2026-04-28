import { useState } from "react";
import {
  Box, Grid, Typography, Skeleton, Alert, IconButton, Tooltip, Tab, Tabs,
} from "@mui/material";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import RefreshIcon from "@mui/icons-material/Refresh";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import { useAnalytics } from "@/hooks/useAnalytics";
import { TrendLine } from "@/components/charts/TrendLine";
import { IncomeExpenseOverview } from "@/components/charts/IncomeExpenseOverview";
import { BudgetRebalancer } from "@/components/dashboard/BudgetRebalancer";
import { CategoryBudgetTable } from "@/components/budget/CategoryBudgetTable";
import { CollapsibleCard } from "@/components/shared/CollapsibleCard";
import { DrillDownDrawer, DrillDown } from "@/components/expenses/DrillDownDrawer";
import { SpendingInsights } from "@/components/analytics/SpendingInsights";
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

export function Analytics() {
  const {
    month, prevMonth, nextMonth, isCurrentMonth,
    summary, trends, comparison, incomeBreakdown, merchants,
    loading, error,
    insight, insightLoading, insightError, refreshInsight,
  } = useAnalytics();

  const spentMap = new Map<string, number>(
    (summary?.byCategory ?? []).map((c) => [c.category, c.amount]),
  );
  const prevSummary = trends.find((t) => t.period === getPrevMonthYear(month)) ?? null;
  const { isMobile } = useBreakpoint();

  const [tab, setTab] = useState(0);
  const [drillDown, setDrillDown] = useState<DrillDown | null>(null);
  const openDrillDown = (category?: string, overrideMonth?: string) =>
    setDrillDown({ category, month: overrideMonth ?? month });
  const closeDrillDown = () => setDrillDown(null);

  if (error) return <Alert severity="error" sx={{ m: 3 }}>{error}</Alert>;

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1200, mx: "auto" }}>
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

      <Tabs
        value={tab}
        onChange={(_, v: number) => setTab(v)}
        sx={{ mb: 3, borderBottom: 1, borderColor: "divider" }}
      >
        <Tab label="Insights" />
        <Tab label="Budget" />
      </Tabs>

      {/* ── Insights tab ── */}
      {tab === 0 && (
        <Grid container spacing={2}>
          {summary && !loading && (
            <Grid size={12}>
              <SpendingInsights
                summary={summary}
                prevSummary={prevSummary}
                trends={trends}
                comparison={comparison}
                merchants={merchants}
                isCurrentMonth={isCurrentMonth}
                monthYear={month}
                onCategoryClick={(c) => openDrillDown(c)}
              />
            </Grid>
          )}

          <Grid size={12}>
            <CollapsibleCard
              storageKey="analytics-insight"
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
                      <RefreshIcon fontSize="small" />
                    </IconButton>
                  </span>
                </Tooltip>
              }
            >
              {insightLoading ? (
                <Box>
                  <Skeleton width="95%" />
                  <Skeleton width="80%" />
                  <Skeleton width="60%" />
                </Box>
              ) : insightError ? (
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
          </Grid>

          <Grid size={12}>
            <CollapsibleCard storageKey="analytics-trend" title="6-Month Trend">
              {loading
                ? <Skeleton height={220} />
                : <TrendLine data={trends} height={isMobile ? 180 : 220} onMonthClick={(m) => openDrillDown(undefined, m)} />}
            </CollapsibleCard>
          </Grid>
        </Grid>
      )}

      {/* ── Budget tab ── */}
      {tab === 1 && (
        <Grid container spacing={2}>
          {comparison && isCurrentMonth && (
            <Grid size={12}>
              <CollapsibleCard
                storageKey="analytics-rebalancer"
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
            </Grid>
          )}

          <Grid size={12}>
            <CollapsibleCard storageKey="analytics-categories" title="Categories & Budgets">
              <CategoryBudgetTable spentMap={spentMap} />
            </CollapsibleCard>
          </Grid>

          <Grid size={12}>
            <CollapsibleCard storageKey="analytics-income-expense" title="Income vs. Expenses">
              <IncomeExpenseOverview
                expenses={comparison}
                income={incomeBreakdown}
                loading={loading}
                onCategoryClick={(c) => openDrillDown(c)}
              />
            </CollapsibleCard>
          </Grid>
        </Grid>
      )}

      <DrillDownDrawer
        open={drillDown !== null}
        onClose={closeDrillDown}
        drillDown={drillDown}
      />
    </Box>
  );
}
