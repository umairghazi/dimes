import { RawTransaction } from "../interfaces/AITypes";
import { EXPENSE_CATEGORIES } from "../../types/common.types";

export function buildClassificationPrompt(transactions: RawTransaction[]): string {
  return `You are a financial transaction classifier. Classify each transaction into one of the following categories: ${EXPENSE_CATEGORIES.join(", ")}.

For each transaction, return a JSON array with the same order as the input. Each item must have:
- category: one of the allowed categories above
- subCategory: optional subcategory string (e.g., "Groceries" under "Food & Dining")
- merchantName: cleaned merchant name if identifiable, otherwise null
- isRecurring: boolean, true if this looks like a subscription or recurring bill
- confidence: number between 0 and 1

Return ONLY valid JSON array, no explanation.

Transactions:
${JSON.stringify(transactions, null, 2)}`;
}
