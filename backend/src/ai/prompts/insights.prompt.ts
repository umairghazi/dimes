import { AnalyticsData } from "../interfaces/AITypes";

export function buildInsightPrompt(data: AnalyticsData): string {
  return `You are a personal finance advisor. Generate a brief, actionable insight (2-3 sentences) based on this spending data.

          Period: ${data.period}
          Total Spend: $${data.totalSpend.toFixed(2)}
          By Category:
          ${data.byCategory.map((c) => `  - ${c.category}: $${c.amount.toFixed(2)} (${c.count} transactions)`).join("\n")}
          ${data.topMerchants ? `\nTop Merchants:\n${data.topMerchants.map((m) => `  - ${m.name}: $${m.amount.toFixed(2)}`).join("\n")}` : ""}

          Be specific, helpful, and positive. Do not use bullet points. Return plain text only.`;
}

export function buildCategorySuggestionPrompt(description: string): string {
  return `Classify this transaction description into a spending category.

          Description: "${description}"

          Return a JSON object with:
          - category: one of: Food & Dining, Transport, Shopping, Entertainment, Health, Utilities, Travel, Income, Subscriptions, Personal Care, Education, Other
          - confidence: number between 0 and 1

          Return ONLY valid JSON.`;
}
