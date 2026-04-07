import { RawTransaction } from "../interfaces/AITypes";
import { EXPENSE_CATEGORIES } from "../../types/common.types";

export function buildClassificationPrompt(transactions: RawTransaction[], categories?: string[]): string {
  const categoryList = categories ?? EXPENSE_CATEGORIES;
  return `You are a financial transaction classifier. Classify each transaction into exactly one of the following categories:

${categoryList.map((c) => `- ${c}`).join("\n")}

Guidelines:
- "Bill - *" categories are for recurring utility/service bills (electricity, gas, internet, phone, water heater rental).
- "Car - *" covers all vehicle-related costs: fuel, insurance, loan payments, parking, maintenance.
- "Giving - Sadaqah" is voluntary Islamic charity; "Giving - Zakat" is obligatory Islamic almsgiving.
- "Home - *" covers mortgage, property tax, home insurance, maintenance fees, and renovation costs.
- "Groceries" is for supermarket/food store purchases; "Restaurants" is for dining out.
- "Physio / Massage" is distinct from general "Health / Medical".
- "Subscription / Membership Fee" covers streaming, software, gym memberships, and similar recurring fees.
- "Commute" is for public transit, ride-shares, and regular work-related travel.
- "Toll" is specifically for highway/bridge toll charges.
- "Separation" covers legal or financial costs related to separation/divorce.
- Use "Miscellaneous" only when no other category fits clearly (if available).

For each transaction, return a JSON array in the same order as the input. Each item must have:
- category: one of the allowed categories listed above (exact string match required)
- merchantName: cleaned merchant name if identifiable, otherwise null
- isRecurring: boolean, true if this looks like a subscription or recurring bill
- confidence: number between 0 and 1

Return ONLY a valid JSON array, no explanation.

Transactions:
${JSON.stringify(transactions, null, 2)}`;
}
