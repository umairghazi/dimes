import { Box, Grid, Card, CardContent, Typography, Skeleton, Alert } from "@mui/material";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import SavingsIcon from "@mui/icons-material/Money";
import { useAnalytics } from "@/hooks/useAnalytics";
import { QuickAddFAB } from "@/components/quickAdd/QuickAddFAB";
import { SpendingDonut } from "@/components/charts/SpendingDonut";
import { TrendLine } from "@/components/charts/TrendLine";
import { NLQueryBar } from "@/components/query/NLQueryBar";
import { useBreakpoint } from "@/hooks/useBreakpoint";
import { tokens } from "@/styles/theme/tokens";

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
  const { summary, trends, loading, error } = useAnalytics();
  const { isMobile } = useBreakpoint();
  const monthLabel = new Date().toLocaleString("default", { month: "long", year: "numeric" });

  if (error) return <Alert severity="error" sx={{ m: 3 }}>{error}</Alert>;

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1400, mx: "auto" }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, mb: 0.25 }}>Dashboard</Typography>
        <Typography color="text.secondary" sx={{ fontSize: "0.9375rem" }}>{monthLabel}</Typography>
      </Box>

      <NLQueryBar />

      <Grid container spacing={2} sx={{ mb: 3 }}>
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
        <Grid size={{ xs: 12, md: 5 }}>
          <Card sx={{ height: "100%" }}>
            <CardContent sx={{ p: "20px !important" }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>Spending by Category</Typography>
              {loading ? <Skeleton variant="circular" width={200} height={200} sx={{ mx: "auto" }} /> : summary ? <SpendingDonut data={summary.byCategory} /> : null}
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 7 }}>
          <Card sx={{ height: "100%" }}>
            <CardContent sx={{ p: "20px !important" }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>Spending Trend</Typography>
              {loading ? <Skeleton variant="rectangular" height={220} sx={{ borderRadius: 2 }} /> : <TrendLine data={trends} height={isMobile ? 180 : 220} />}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <QuickAddFAB />
    </Box>
  );
}
