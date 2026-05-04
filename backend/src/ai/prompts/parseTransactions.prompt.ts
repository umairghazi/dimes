export function buildParseTransactionsPrompt(rawText: string): string {
  const year = new Date().getFullYear();
  return `You are a bank statement parser. Extract all debit/expense transactions from the text below.

Return ONLY a JSON array, no markdown, no explanation. Each element:
{
  "date": "YYYY-MM-DD",       // use ${year} if no year is present
  "description": "string",    // merchant or payee, trimmed
  "amount": 12.34             // positive number, no currency symbols
}

Rules:
- Include only money-OUT rows (purchases, withdrawals, debits, fees, charges)
- Skip deposits, credits, refunds, salary, and any income
- Skip header rows, balance lines, totals, and account information
- Strip currency symbols ($, £, €, CAD) and commas from amounts
- Do not include running balances
- If there are no expense transactions, return []

Bank statement:
---
${rawText}
---`;
}
