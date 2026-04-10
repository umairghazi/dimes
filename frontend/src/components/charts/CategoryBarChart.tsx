import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { Box, Typography } from "@mui/material";
import { CategorySummary } from "@/types/analytics.types";

const COLORS = [
  "#1976d2", "#9c27b0", "#2e7d32", "#ed6c02", "#d32f2f",
  "#0288d1", "#f06292", "#26a69a", "#ffa726", "#66bb6a",
  "#42a5f5", "#7e57c2",
];

// Approximate character width for font-size 12px
const CHAR_WIDTH = 6.5;
const MAX_LABEL_WIDTH = 200;
const MIN_LABEL_WIDTH = 80;

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <Box
      sx={{
        bgcolor: "grey.900",
        color: "common.white",
        px: 1.5,
        py: 1,
        borderRadius: 1,
        fontSize: 13,
        boxShadow: 3,
      }}
    >
      <Typography variant="caption" sx={{ display: "block", fontWeight: 600, mb: 0.25 }}>
        {label}
      </Typography>
      <Typography variant="caption">
        ${Number(payload[0].value).toFixed(2)}
      </Typography>
    </Box>
  );
}

interface CategoryBarChartProps {
  data: CategorySummary[];
  height?: number; // if omitted, auto-sizes to 36px × number of categories
  onCategoryClick?: (category: string) => void;
}

const BAR_HEIGHT = 36; // px per bar row
const MIN_HEIGHT = 160;

export function CategoryBarChart({ data, height, onCategoryClick }: CategoryBarChartProps) {
  const filtered = data
    .filter((d) => d.amount > 0 && d.category !== "Income")
    .sort((a, b) => b.amount - a.amount);

  const chartHeight = height ?? Math.max(MIN_HEIGHT, filtered.length * BAR_HEIGHT);

  const labelWidth = Math.min(
    Math.max(MIN_LABEL_WIDTH, ...filtered.map((d) => d.category.length * CHAR_WIDTH)),
    MAX_LABEL_WIDTH,
  );

  // Truncate label if it would overflow even at max width
  const formatLabel = (value: string) => {
    const maxChars = Math.floor(MAX_LABEL_WIDTH / CHAR_WIDTH);
    return value.length > maxChars ? `${value.slice(0, maxChars - 1)}…` : value;
  };

  return (
    <ResponsiveContainer width="100%" height={chartHeight}>
      <BarChart
        data={filtered}
        layout="vertical"
        margin={{ top: 5, right: 20, bottom: 5, left: 5 }}
        onClick={onCategoryClick ? (e) => { if (e?.activeLabel) onCategoryClick(String(e.activeLabel)); } : undefined}
        style={onCategoryClick ? { cursor: "pointer" } : undefined}
      >
        <CartesianGrid strokeDasharray="3 3" horizontal={false} opacity={0.3} />
        <XAxis type="number" tick={{ fontSize: 12 }} tickFormatter={(v) => `$${v}`} />
        <YAxis
          type="category"
          dataKey="category"
          tick={{ fontSize: 12 }}
          width={labelWidth}
          tickFormatter={formatLabel}
        />
        <Tooltip content={<CustomTooltip />} />
        <Bar dataKey="amount" name="Amount" radius={[0, 4, 4, 0]}>
          {filtered.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
