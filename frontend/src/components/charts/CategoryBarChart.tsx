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
import { CategorySummary } from "@/types/analytics.types";

const COLORS = [
  "#1976d2", "#9c27b0", "#2e7d32", "#ed6c02", "#d32f2f",
  "#0288d1", "#f06292", "#26a69a", "#ffa726", "#66bb6a",
  "#42a5f5", "#7e57c2",
];

interface CategoryBarChartProps {
  data: CategorySummary[];
  height?: number;
  onCategoryClick?: (category: string) => void;
}

export function CategoryBarChart({ data, height = 260, onCategoryClick }: CategoryBarChartProps) {
  const filtered = data.filter((d) => d.amount > 0 && d.category !== "Income")
    .sort((a, b) => b.amount - a.amount);

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        data={filtered}
        layout="vertical"
        margin={{ top: 5, right: 20, bottom: 5, left: 80 }}
        onClick={onCategoryClick ? (e) => { if (e?.activeLabel) onCategoryClick(String(e.activeLabel)); } : undefined}
        style={onCategoryClick ? { cursor: "pointer" } : undefined}
      >
        <CartesianGrid strokeDasharray="3 3" horizontal={false} opacity={0.3} />
        <XAxis type="number" tick={{ fontSize: 12 }} tickFormatter={(v) => `$${v}`} />
        <YAxis type="category" dataKey="category" tick={{ fontSize: 12 }} width={80} />
        <Tooltip formatter={(v) => v != null ? `$${Number(v).toFixed(2)}` : ""} />
        <Bar dataKey="amount" name="Amount" radius={[0, 4, 4, 0]}>
          {filtered.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
