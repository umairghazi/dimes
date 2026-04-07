import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { CategorySummary } from "@/types/analytics.types";

const COLORS = [
  "#1976d2", "#9c27b0", "#2e7d32", "#ed6c02", "#d32f2f",
  "#0288d1", "#f06292", "#26a69a", "#ffa726", "#66bb6a",
  "#42a5f5", "#7e57c2",
];

interface SpendingDonutProps {
  data: CategorySummary[];
}

export function SpendingDonut({ data }: SpendingDonutProps) {
  const filtered = data.filter((d) => d.amount > 0 && d.category !== "Income");

  return (
    <ResponsiveContainer width="100%" height={220}>
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
        >
          {filtered.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip formatter={(v: number) => `$${v.toFixed(2)}`} />
        <Legend
          iconType="circle"
          iconSize={8}
          formatter={(value) => <span style={{ fontSize: 12 }}>{value}</span>}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
