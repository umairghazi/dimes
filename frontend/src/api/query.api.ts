import { apiClient } from "./client";

export interface QueryResult {
  answer: string;
  breakdown?: unknown[];
  parsedTransaction?: {
    amount: number;
    description: string;
    category: string;
    date: string;
    merchantName?: string;
  };
}

export const queryApi = {
  nl: (query: string, mode: "ask" | "add" = "ask") =>
    apiClient.post<QueryResult>("/query/nl", { query, mode }).then((r) => r.data),
};
