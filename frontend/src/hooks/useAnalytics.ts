import { useState, useEffect, useCallback } from "react";
import { analyticsApi } from "@/api/analytics.api";
import { MonthlySummary } from "@/types/analytics.types";

export function useAnalytics(month?: string) {
  const [summary, setSummary] = useState<MonthlySummary | null>(null);
  const [trends, setTrends] = useState<MonthlySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [insight, setInsight] = useState<string | null>(null);
  const [insightLoading, setInsightLoading] = useState(false);
  const [insightError, setInsightError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    Promise.all([analyticsApi.getSummary(month), analyticsApi.getTrends()])
      .then(([s, t]) => { setSummary(s); setTrends(t); })
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

  useEffect(() => { void fetchInsight(); }, [fetchInsight]);

  return { summary, trends, loading, error, insight, insightLoading, insightError, refreshInsight: fetchInsight };
}
