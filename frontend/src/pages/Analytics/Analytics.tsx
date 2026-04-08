import { Box, Typography, Grid, Card, CardContent, Skeleton, Alert } from "@mui/material";
import { useAnalytics } from "@/hooks/useAnalytics";
import { TrendLine } from "@/components/charts/TrendLine";
import { SpendingDonut } from "@/components/charts/SpendingDonut";
import { CategoryBarChart } from "@/components/charts/CategoryBarChart";

export function Analytics() {
  const { summary, trends, loading, error } = useAnalytics();

  if (error) return <Alert severity="error" sx={{ m: 3 }}>{error}</Alert>;

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 3 }}>Analytics</Typography>

      <Grid container spacing={2}>
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
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>This Month by Category</Typography>
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
      </Grid>
    </Box>
  );
}
