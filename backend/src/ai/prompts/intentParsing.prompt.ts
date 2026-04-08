import { UserContext } from "../interfaces/AITypes";

export function buildIntentParsingPrompt(query: string, context: UserContext): string {
  const today = new Date().toISOString().split("T")[0];
  const categories = context.availableCategories ?? context.recentCategories ?? ["Miscellaneous"];
  return `You are a financial query parser. Parse the user's natural language query into a structured JSON object.

          Today's date: ${today}
          Available categories: ${categories.join(", ")}

          Return a JSON object with:
          - metric: "total_spend" | "average_spend" | "count" | "list"
          - category: one of the available categories (if applicable), otherwise omit
          - period: a month in "YYYY-MM" format (if applicable), otherwise omit
          - dateFrom: ISO date string (if applicable), otherwise omit
          - dateTo: ISO date string (if applicable), otherwise omit
          - merchantName: string (if applicable), otherwise omit

          Return ONLY valid JSON, no explanation.

          Query: "${query}"`;
}

export function buildNLTransactionPrompt(input: string, context: UserContext): string {
  const today = new Date().toISOString().split("T")[0];
  const categories = context.availableCategories ?? context.recentCategories ?? ["Miscellaneous"];
  return `You are a financial transaction parser. Parse the user's natural language input into a structured transaction.

          Today's date: ${today}
          Available categories: ${categories.join(", ")}

          Return a JSON object with:
          - amount: number (always positive)
          - description: string (clean description)
          - category: one of the available categories
          - date: ISO date string (e.g. "${today}")
          - merchantName: string if identifiable, otherwise omit

          Return ONLY valid JSON, no explanation.

          Input: "${input}"`;
}
