import { useState, useEffect } from "react";
import { analyticsApi } from "@/api/analytics.api";
import { MonthlySummary } from "@/types/analytics.types";

export function useAnalytics(month?: string) {
  const [summary, setSummary] = useState<MonthlySummary | null>(null);
  const [trends, setTrends] = useState<MonthlySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    Promise.all([analyticsApi.getSummary(month), analyticsApi.getTrends()])
      .then(([s, t]) => { setSummary(s); setTrends(t); })
      .catch(() => setError("Failed to load analytics"))
      .finally(() => setLoading(false));
  }, [month]);

  return { summary, trends, loading, error };
}
