import { useState } from "react";
import {
  Box, Grid, Card, CardContent, Typography,
  Skeleton, Alert, IconButton,
} from "@mui/material";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import SavingsIcon from "@mui/icons-material/Money";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { useAnalytics } from "@/hooks/useAnalytics";
import { QuickAddFAB } from "@/components/quickAdd/QuickAddFAB";
import { SpendingDonut } from "@/components/charts/SpendingDonut";
import { CategoryBarChart } from "@/components/charts/CategoryBarChart";
import { NLQueryBar } from "@/components/query/NLQueryBar";
import { CollapsibleCard } from "@/components/shared/CollapsibleCard";
import { DrillDownDrawer, DrillDown } from "@/components/expenses/DrillDownDrawer";
import { tokens } from "@/styles/theme/tokens";

function formatMonthLabel(monthYear: string): string {
  const [year, month] = monthYear.split("-").map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });
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
    summary, loading, error,
  } = useAnalytics();

  const [drillDown, setDrillDown] = useState<DrillDown | null>(null);
  const openDrillDown = (category?: string) =>
    setDrillDown({ category, month });
  const closeDrillDown = () => setDrillDown(null);

  if (error) return <Alert severity="error" sx={{ m: 3 }}>{error}</Alert>;

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1000, mx: "auto" }}>
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
      <Grid container spacing={2} sx={{ mb: 2, mt: 0 }}>
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

      {/* Spending donut */}
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <CollapsibleCard storageKey="dashboard-donut" title="Spending by Category">
          {loading
            ? <Skeleton variant="circular" width={200} height={200} sx={{ mx: "auto" }} />
            : summary
              ? <SpendingDonut data={summary.byCategory} onCategoryClick={(c) => openDrillDown(c)} />
              : null}
        </CollapsibleCard>

        <CollapsibleCard storageKey="dashboard-category-bar" title="Category Breakdown">
          {loading
            ? <Skeleton height={260} />
            : summary
              ? <CategoryBarChart data={summary.byCategory} onCategoryClick={(c) => openDrillDown(c)} />
              : null}
        </CollapsibleCard>
      </Box>

      <QuickAddFAB />

      <DrillDownDrawer
        open={drillDown !== null}
        onClose={closeDrillDown}
        drillDown={drillDown}
      />
    </Box>
  );
}
