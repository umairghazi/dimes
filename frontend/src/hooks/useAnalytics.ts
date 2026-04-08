import { useState, useEffect, useCallback } from "react";
import { analyticsApi } from "@/api/analytics.api";
import { MonthlySummary, BudgetComparison } from "@/types/analytics.types";

function currentMonthYear(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export function useAnalytics() {
  const [month, setMonth] = useState(currentMonthYear);

  const [summary, setSummary] = useState<MonthlySummary | null>(null);
  const [trends, setTrends] = useState<MonthlySummary[]>([]);
  const [comparison, setComparison] = useState<BudgetComparison | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [insight, setInsight] = useState<string | null>(null);
  const [insightLoading, setInsightLoading] = useState(false);
  const [insightError, setInsightError] = useState<string | null>(null);

  useEffect(() => {
    setInsight(null);
    setInsightError(null);
    setLoading(true);
    Promise.all([
      analyticsApi.getSummary(month),
      analyticsApi.getTrends(),
      analyticsApi.getBudgetComparison(month),
    ])
      .then(([s, t, c]) => { setSummary(s); setTrends(t); setComparison(c); })
      .catch(() => setError("Failed to load analytics"))
      .finally(() => setLoading(false));
  }, [month]);

  const fetchInsight = useCallback(async () => {
    setInsightLoading(true);
    setInsightError(null);
    try {
      const { insight: text } = await analyticsApi.getInsight(month);
      setInsight(text);
    } catch {
      setInsightError("AI insight unavailable — check your AI provider configuration.");
    } finally {
      setInsightLoading(false);
    }
  }, [month]);


  const prevMonth = useCallback(() => {
    setMonth((m) => {
      const [y, mo] = m.split("-").map(Number);
      const d = new Date(y, mo - 2, 1);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    });
  }, []);

  const nextMonth = useCallback(() => {
    setMonth((m) => {
      const [y, mo] = m.split("-").map(Number);
      const d = new Date(y, mo, 1);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    });
  }, []);

  const isCurrentMonth = month === currentMonthYear();

  return {
    month, prevMonth, nextMonth, isCurrentMonth,
    summary, trends, comparison,
    loading, error,
    insight, insightLoading, insightError, refreshInsight: fetchInsight,
  };
}
