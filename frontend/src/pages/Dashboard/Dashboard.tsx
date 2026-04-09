import { useState } from "react";
import {
  Box, Grid, Card, CardContent, Typography,
  Skeleton, Alert, IconButton, Tooltip,
} from "@mui/material";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import SavingsIcon from "@mui/icons-material/Money";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import RefreshIcon from "@mui/icons-material/Refresh";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import { useAnalytics } from "@/hooks/useAnalytics";
import { QuickAddFAB } from "@/components/quickAdd/QuickAddFAB";
import { SpendingDonut } from "@/components/charts/SpendingDonut";
import { CategoryBarChart } from "@/components/charts/CategoryBarChart";
import { TrendLine } from "@/components/charts/TrendLine";
import { BudgetComparisonTable } from "@/components/charts/BudgetComparisonTable";
import { NLQueryBar } from "@/components/query/NLQueryBar";
import { useBreakpoint } from "@/hooks/useBreakpoint";
import { tokens } from "@/styles/theme/tokens";
import { DrillDownDrawer, DrillDown } from "@/components/expenses/DrillDownDrawer";

function formatMonthLabel(monthYear: string): string {
  const [year, month] = monthYear.split("-").map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString(undefined, { month: "long", year: "numeric" });
}

interface StatCardProps {
  label: string;
  amount: number;
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
}

function StatCard({ label, amount, icon, iconBg, iconColor }: StatCardProps) {
  return (
    <Card>
      <CardContent sx={{ p: "20px !important" }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 2 }}>
          <Typography sx={{ fontSize: "0.6875rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "text.secondary" }}>
            {label}
          </Typography>
          <Box sx={{ width: 34, height: 34, borderRadius: "9px", bgcolor: iconBg, display: "flex", alignItems: "center", justifyContent: "center", color: iconColor }}>
            {icon}
          </Box>
        </Box>
        <Typography sx={{ fontSize: "1.875rem", fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1, color: "text.primary" }}>
          ${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </Typography>
      </CardContent>
    </Card>
  );
}

export function Dashboard() {
  const {
    month, prevMonth, nextMonth, isCurrentMonth,
    summary, trends, comparison,
    loading, error,
    insight, insightLoading, insightError, refreshInsight,
  } = useAnalytics();
  const { isMobile } = useBreakpoint();

  const [drillDown, setDrillDown] = useState<DrillDown | null>(null);
  const openDrillDown = (category?: string, overrideMonth?: string) =>
    setDrillDown({ category, month: overrideMonth ?? month });
  const closeDrillDown = () => setDrillDown(null);

  if (error) return <Alert severity="error" sx={{ m: 3 }}>{error}</Alert>;

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1400, mx: "auto" }}>

      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 800 }}>Dashboard</Typography>
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

      <NLQueryBar />

      {/* Stat cards */}
      <Grid container spacing={2} sx={{ mb: 2 }}>
        {loading
          ? [0, 1, 2].map((i) => (
              <Grid size={{ xs: 12, sm: 4 }} key={i}>
                <Skeleton variant="rectangular" height={108} sx={{ borderRadius: 2 }} />
              </Grid>
            ))
          : summary && (
              <>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <StatCard label="Total Spend" amount={summary.totalSpend} icon={<TrendingDownIcon sx={{ fontSize: 18 }} />} iconBg={tokens.colors.errorBg} iconColor={tokens.colors.error} />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <StatCard label="Total Income" amount={summary.totalIncome} icon={<TrendingUpIcon sx={{ fontSize: 18 }} />} iconBg={tokens.colors.successBg} iconColor={tokens.colors.success} />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <StatCard label="Net Savings" amount={summary.netSavings} icon={<SavingsIcon sx={{ fontSize: 18 }} />} iconBg={tokens.colors.accentBg} iconColor={tokens.colors.accent} />
                </Grid>
              </>
            )}
      </Grid>

      <Grid container spacing={2}>

        {/* AI Insight */}
        <Grid size={12}>
          <Card>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1.5 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <AutoAwesomeIcon fontSize="small" color="primary" />
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>AI Insight</Typography>
                </Box>
                <Tooltip title={insight ? "Regenerate" : "Generate"}>
                  <span>
                    <IconButton size="small" onClick={() => void refreshInsight()} disabled={insightLoading}>
                      <RefreshIcon fontSize="small" />
                    </IconButton>
                  </span>
                </Tooltip>
              </Box>
              {insightLoading ? (
                <Box>
                  <Skeleton width="95%" />
                  <Skeleton width="80%" />
                  <Skeleton width="60%" />
                </Box>
              ) : insightError ? (
                <Typography variant="body2" color="text.disabled">{insightError}</Typography>
              ) : insight ? (
                <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.7 }}>{insight}</Typography>
              ) : (
                <Typography variant="body2" color="text.disabled">Click refresh to generate an AI insight for this month.</Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Donut + Bar chart */}
        <Grid size={{ xs: 12, md: 5 }}>
          <Card sx={{ height: "100%" }}>
            <CardContent sx={{ p: "20px !important" }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>Spending by Category</Typography>
              {loading
                ? <Skeleton variant="circular" width={200} height={200} sx={{ mx: "auto" }} />
                : summary
                  ? <SpendingDonut data={summary.byCategory} onCategoryClick={(c) => openDrillDown(c)} />
                  : null}
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 7 }}>
          <Card sx={{ height: "100%" }}>
            <CardContent sx={{ p: "20px !important" }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>Category Breakdown</Typography>
              {loading
                ? <Skeleton height={260} />
                : summary
                  ? <CategoryBarChart data={summary.byCategory} onCategoryClick={(c) => openDrillDown(c)} />
                  : null}
            </CardContent>
          </Card>
        </Grid>

        {/* Trend */}
        <Grid size={12}>
          <Card>
            <CardContent sx={{ p: "20px !important" }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>6-Month Trend</Typography>
              {loading
                ? <Skeleton height={220} />
                : <TrendLine data={trends} height={isMobile ? 180 : 220} onMonthClick={(m) => openDrillDown(undefined, m)} />}
            </CardContent>
          </Card>
        </Grid>

        {/* Budget vs Actual */}
        <Grid size={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>Budget vs. Actual</Typography>
              <BudgetComparisonTable data={comparison} loading={loading} onCategoryClick={(c) => openDrillDown(c)} />
            </CardContent>
          </Card>
        </Grid>

      </Grid>

      <QuickAddFAB />

      <DrillDownDrawer
        open={drillDown !== null}
        onClose={closeDrillDown}
        drillDown={drillDown}
      />
    </Box>
  );
}
