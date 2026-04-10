import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { Box, Typography } from "@mui/material";
import { CategorySummary } from "@/types/analytics.types";

const COLORS = [
  "#1976d2", "#9c27b0", "#2e7d32", "#ed6c02", "#d32f2f",
  "#0288d1", "#f06292", "#26a69a", "#ffa726", "#66bb6a",
  "#42a5f5", "#7e57c2",
];

function CustomTooltip({ active, payload }: { active?: boolean; payload?: { name: string; value: number }[] }) {
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
        {payload[0].name}
      </Typography>
      <Typography variant="caption">
        ${Number(payload[0].value).toFixed(2)}
      </Typography>
    </Box>
  );
}

interface SpendingDonutProps {
  data: CategorySummary[];
  onCategoryClick?: (category: string) => void;
}

export function SpendingDonut({ data, onCategoryClick }: SpendingDonutProps) {
  const filtered = data.filter((d) => d.amount > 0 && d.category !== "Income");

  return (
    <Box>
      {/* Fixed-height donut — never compressed by legend */}
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie
            data={filtered}
            dataKey="amount"
            nameKey="category"
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={85}
            paddingAngle={2}
            onClick={onCategoryClick ? (entry) => onCategoryClick((entry as unknown as { category: string }).category) : undefined}
            style={onCategoryClick ? { cursor: "pointer" } : undefined}
          >
            {filtered.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>

      {/* Legend outside the chart so it never squeezes the donut */}
      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          gap: 0.75,
          mt: 1,
          px: 1,
          justifyContent: "center",
        }}
      >
        {filtered.map((entry, i) => (
          <Box
            key={entry.category}
            onClick={onCategoryClick ? () => onCategoryClick(entry.category) : undefined}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 0.5,
              cursor: onCategoryClick ? "pointer" : "default",
            }}
          >
            <Box
              sx={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                bgcolor: COLORS[i % COLORS.length],
                flexShrink: 0,
              }}
            />
            <Typography variant="caption" color="text.secondary" noWrap>
              {entry.category}
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
}
