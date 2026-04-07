import { useState } from "react";
import { queryApi, QueryResult } from "@/api/query.api";

export function useNLQuery() {
  const [result, setResult] = useState<QueryResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const query = async (input: string, mode: "ask" | "add" = "ask") => {
    setLoading(true);
    setError(null);
    try {
      const data = await queryApi.nl(input, mode);
      setResult(data);
      return data;
    } catch {
      setError("Query failed");
      return null;
    } finally {
      setLoading(false);
    }
  };

  const clear = () => setResult(null);

  return { result, loading, error, query, clear };
}
