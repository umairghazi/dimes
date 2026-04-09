import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { analyticsApi } from "@/api/analytics.api";
import { MonthlySummary, BudgetComparison } from "@/types/analytics.types";

function currentMonthYear(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export function useAnalytics() {
  const [month, setMonth] = useState(currentMonthYear);

  const summaryQuery = useQuery<MonthlySummary>({
    queryKey: ["analytics", "summary", month],
    queryFn: () => analyticsApi.getSummary(month),
    staleTime: 5 * 60 * 1000,
  });

  const comparisonQuery = useQuery<BudgetComparison>({
    queryKey: ["analytics", "budget-comparison", month],
    queryFn: () => analyticsApi.getBudgetComparison(month),
    staleTime: 5 * 60 * 1000,
  });

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

  return {
    month,
    prevMonth,
    nextMonth,
    isCurrentMonth: month === currentMonthYear(),
    summary: summaryQuery.data ?? null,
    comparison: comparisonQuery.data ?? null,
    loading: summaryQuery.isLoading || comparisonQuery.isLoading,
    error: summaryQuery.isError || comparisonQuery.isError ? "Failed to load analytics" : null,
    refetch: () => {
      summaryQuery.refetch();
      comparisonQuery.refetch();
    },
  };
}
