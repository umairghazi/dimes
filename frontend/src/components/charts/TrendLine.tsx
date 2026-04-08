import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { MonthlySummary } from "@/types/analytics.types";

interface TrendLineProps {
  data: MonthlySummary[];
  height?: number;
}

export function TrendLine({ data, height = 220 }: TrendLineProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
        <XAxis dataKey="period" tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `$${v}`} />
        <Tooltip formatter={(v) => v != null ? `$${Number(v).toFixed(2)}` : ""} />
        <Legend />
        <Line
          type="monotone"
          dataKey="totalSpend"
          name="Spend"
          stroke="#d32f2f"
          strokeWidth={2}
          dot={false}
        />
        <Line
          type="monotone"
          dataKey="totalIncome"
          name="Income"
          stroke="#2e7d32"
          strokeWidth={2}
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
