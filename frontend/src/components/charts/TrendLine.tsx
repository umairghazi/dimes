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
  onMonthClick?: (month: string) => void;
}

export function TrendLine({ data, height = 220, onMonthClick }: TrendLineProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart
        data={data}
        margin={{ top: 5, right: 10, bottom: 5, left: 0 }}
        onClick={onMonthClick ? (e) => { if (e?.activeLabel) onMonthClick(String(e.activeLabel)); } : undefined}
        style={onMonthClick ? { cursor: "pointer" } : undefined}
      >
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
          dot={{ r: 3, strokeWidth: 0 }}
          activeDot={{ r: 5 }}
        />
        <Line
          type="monotone"
          dataKey="totalIncome"
          name="Income"
          stroke="#2e7d32"
          strokeWidth={2}
          dot={{ r: 3, strokeWidth: 0 }}
          activeDot={{ r: 5 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
