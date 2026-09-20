import { Box, Paper, Skeleton, Typography } from "@mui/material";
import { ReactNode } from "react";
import { financeSurfaces } from "./financeStyles";

interface WidgetCardProps {
  title: string;
  meta?: ReactNode;
  children: ReactNode;
  minHeight?: number;
}

export function WidgetCard({ title, meta, children, minHeight }: WidgetCardProps) {
  return (
    <Paper variant="outlined" sx={{ ...financeSurfaces.panel, borderRadius: 1, overflow: "hidden", minHeight }}>
      <Box sx={{ px: 1.5, py: 1.25, borderBottom: "1px solid", borderColor: "divider", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 900, color: "text.primary" }}>
          {title}
        </Typography>
        {meta}
      </Box>
      {children}
    </Paper>
  );
}

export function ChartSkeleton({ title }: { title: string }) {
  return (
    <WidgetCard title={title} minHeight={320}>
      <Box sx={{ p: 2 }}>
        <Skeleton variant="rectangular" height={238} sx={{ borderRadius: 1 }} />
      </Box>
    </WidgetCard>
  );
}

