import { Paper, Skeleton, Typography } from "@mui/material";
import { financeSurfaces } from "./financeStyles";

interface MetricCardProps {
  label: string;
  value: string;
  helper?: string;
  tone?: "default" | "good" | "bad";
}

export function MetricCard({ label, value, helper, tone = "default" }: MetricCardProps) {
  const color = tone === "good" ? "success.main" : tone === "bad" ? "primary.main" : "text.primary";
  return (
    <Paper variant="outlined" sx={{ ...financeSurfaces.panel, p: 2, height: "100%", minHeight: 88 }}>
      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800 }}>
        {label}
      </Typography>
      <Typography variant="h4" sx={{ mt: 0.75, fontWeight: 900, color }}>
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

export function MetricCardSkeleton({ label }: { label?: string }) {
  return (
    <Paper variant="outlined" sx={{ ...financeSurfaces.panel, p: 2, height: "100%", minHeight: 88 }}>
      {label ? (
        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800 }}>
          {label}
        </Typography>
      ) : (
        <Skeleton width={96} height={18} />
      )}
      <Skeleton width="68%" height={36} sx={{ mt: 0.75 }} />
      <Skeleton width="44%" height={18} sx={{ mt: 0.5 }} />
    </Paper>
  );
}

