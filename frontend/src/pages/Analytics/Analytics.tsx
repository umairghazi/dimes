import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Skeleton,
  Alert,
  IconButton,
  Tooltip,
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { useAnalytics } from "@/hooks/useAnalytics";
import { TrendLine } from "@/components/charts/TrendLine";
import { SpendingDonut } from "@/components/charts/SpendingDonut";
import { CategoryBarChart } from "@/components/charts/CategoryBarChart";
import { BudgetComparisonTable } from "@/components/charts/BudgetComparisonTable";

function formatMonthLabel(monthYear: string): string {
  const [year, month] = monthYear.split("-").map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString(undefined, { month: "long", year: "numeric" });
}

export function Analytics() {
  const {
    month, prevMonth, nextMonth, isCurrentMonth,
    summary, trends, comparison,
    loading, error,
    insight, insightLoading, insightError, refreshInsight,
  } = useAnalytics();

  if (error) return <Alert severity="error" sx={{ m: 3 }}>{error}</Alert>;

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>Analytics</Typography>
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

      <Grid container spacing={2}>
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
              ) : null}
            </CardContent>
          </Card>
        </Grid>

        <Grid size={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>6-Month Trend</Typography>
              {loading ? <Skeleton height={260} /> : <TrendLine data={trends} height={260} />}
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 5 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>Spending by Category</Typography>
              {loading ? (
                <Skeleton variant="circular" width={200} height={200} sx={{ mx: "auto" }} />
              ) : summary ? (
                <SpendingDonut data={summary.byCategory} />
              ) : null}
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 7 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>Category Breakdown</Typography>
              {loading ? (
                <Skeleton height={260} />
              ) : summary ? (
                <CategoryBarChart data={summary.byCategory} />
              ) : null}
            </CardContent>
          </Card>
        </Grid>

        <Grid size={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>Budget vs. Actual</Typography>
              <BudgetComparisonTable data={comparison} loading={loading} />
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
