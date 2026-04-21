import { useState, useCallback, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { analyticsApi } from "@/api/analytics.api";
import { MonthlySummary, BudgetComparison } from "@/types/analytics.types";
import { useAnalyticsStore, isCurrentMonthYear } from "@/store/analyticsStore";

const ANALYTICS_STALE = 5 * 60 * 1000; // 5 min

export function useAnalytics() {
  const { month, prevMonth, nextMonth } = useAnalyticsStore();
  const isCurrentMonth = isCurrentMonthYear(month);

  const [insight, setInsight] = useState<string | null>(null);
  const [insightLoading, setInsightLoading] = useState(false);
  const [insightError, setInsightError] = useState<string | null>(null);

  // Reset insight when month changes
  useEffect(() => {
    setInsight(null);
    setInsightError(null);
  }, [month]);

  const summaryQuery = useQuery<MonthlySummary>({
    queryKey: ["analytics", "summary", month],
    queryFn: () => analyticsApi.getSummary(month),
    staleTime: ANALYTICS_STALE,
  });

  const trendsQuery = useQuery<MonthlySummary[]>({
    queryKey: ["analytics", "trends", 6],
    queryFn: () => analyticsApi.getTrends(),
    staleTime: ANALYTICS_STALE,
  });

  const comparisonQuery = useQuery<BudgetComparison>({
    queryKey: ["analytics", "budget-comparison", month],
    queryFn: () => analyticsApi.getBudgetComparison(month),
    staleTime: ANALYTICS_STALE,
  });

  const incomeBreakdownQuery = useQuery<BudgetComparison>({
    queryKey: ["analytics", "income-breakdown", month],
    queryFn: () => analyticsApi.getIncomeBreakdown(month),
    staleTime: ANALYTICS_STALE,
  });

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

  const loading =
    summaryQuery.isLoading ||
    trendsQuery.isLoading ||
    comparisonQuery.isLoading ||
    incomeBreakdownQuery.isLoading;

  const error =
    summaryQuery.isError ||
    trendsQuery.isError ||
    comparisonQuery.isError ||
    incomeBreakdownQuery.isError
      ? "Failed to load analytics"
      : null;

  return {
    month, prevMonth, nextMonth, isCurrentMonth,
    summary: summaryQuery.data ?? null,
    trends: trendsQuery.data ?? [],
    comparison: comparisonQuery.data ?? null,
    incomeBreakdown: incomeBreakdownQuery.data ?? null,
    loading,
    error,
    insight, insightLoading, insightError, refreshInsight: fetchInsight,
  };
}
