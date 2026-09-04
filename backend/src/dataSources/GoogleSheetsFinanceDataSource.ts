import { google } from "googleapis";
import { env } from "../config/env";
import { AppError } from "../errors/AppError";
import {
  FinanceDataSource,
  FinanceDataSourceStatus,
  FinanceTransaction,
  FinanceTransactionFilters,
  FinanceTransactionType,
} from "./FinanceDataSource";
import { filterFinanceTransactions } from "./filterFinanceTransactions";

type SheetRow = Record<string, string>;

function normalizeHeader(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function cell(row: SheetRow, names: string[]): string {
  for (const name of names) {
    const value = row[normalizeHeader(name)];
    if (value) return value.trim();
  }
  return "";
}

function parseAmount(value: string): number {
  const cleaned = value.replace(/[$,\s]/g, "").replace(/^\((.*)\)$/, "-$1");
  const amount = Number(cleaned);
  return Number.isFinite(amount) ? Math.abs(amount) : 0;
}

function parseDate(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return `${trimmed}T00:00:00.000Z`;

  const parsed = new Date(trimmed.replace(/(\d+)(st|nd|rd|th)/gi, "$1"));
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString();
}

function inferType(row: SheetRow): FinanceTransactionType {
  const explicit = cell(row, ["type", "transaction type"]);
  if (explicit.toLowerCase() === "income") return "income";
  if (explicit.toLowerCase() === "expense") return "expense";

  const section = cell(row, ["section", "table"]);
  if (section.toLowerCase() === "income") return "income";

  return "expense";
}

function configured(): boolean {
  return Boolean(
    env.GOOGLE_SHEETS_SPREADSHEET_ID &&
      env.GOOGLE_SHEETS_SERVICE_ACCOUNT_EMAIL &&
      env.GOOGLE_SHEETS_PRIVATE_KEY,
  );
}

function privateKey(): string {
  return (env.GOOGLE_SHEETS_PRIVATE_KEY ?? "").replace(/\\n/g, "\n");
}

function configuredRange(): string {
  return `${env.GOOGLE_SHEETS_TRANSACTIONS_TAB}!${env.GOOGLE_SHEETS_TRANSACTIONS_RANGE}`;
}

function toRows(values: string[][]): SheetRow[] {
  const [headers, ...body] = values;
  if (!headers || headers.length === 0) return [];

  const normalizedHeaders = headers.map((header) => normalizeHeader(header));
  return body.map((rawRow) => {
    const row: SheetRow = {};
    normalizedHeaders.forEach((header, index) => {
      row[header] = rawRow[index] ?? "";
    });
    return row;
  });
}

export class GoogleSheetsFinanceDataSource implements FinanceDataSource {
  status(): FinanceDataSourceStatus {
    return {
      provider: "google-sheets",
      configured: configured(),
      readOnly: true,
      details: {
        authMode: env.GOOGLE_SHEETS_AUTH_MODE,
        spreadsheetId: env.GOOGLE_SHEETS_SPREADSHEET_ID ?? null,
        transactionsTab: env.GOOGLE_SHEETS_TRANSACTIONS_TAB,
        transactionsRange: env.GOOGLE_SHEETS_TRANSACTIONS_RANGE,
        hasServiceAccountEmail: Boolean(env.GOOGLE_SHEETS_SERVICE_ACCOUNT_EMAIL),
        hasPrivateKey: Boolean(env.GOOGLE_SHEETS_PRIVATE_KEY),
      },
    };
  }

  async listTransactions(_userId: string, filters: FinanceTransactionFilters = {}): Promise<FinanceTransaction[]> {
    if (!configured()) {
      throw new AppError("Google Sheets data source is not configured", 503, "DATA_SOURCE_NOT_CONFIGURED");
    }

    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: env.GOOGLE_SHEETS_SERVICE_ACCOUNT_EMAIL,
        private_key: privateKey(),
      },
      scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
    });

    const sheets = google.sheets({ version: "v4", auth });
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: env.GOOGLE_SHEETS_SPREADSHEET_ID,
      range: configuredRange(),
      valueRenderOption: "FORMATTED_VALUE",
      dateTimeRenderOption: "FORMATTED_STRING",
    });

    const values = (response.data.values ?? []) as string[][];
    const rows = toRows(values)
      .map((row, index): FinanceTransaction | null => {
        const date = parseDate(cell(row, ["date", "transaction date"]));
        const description = cell(row, ["description", "merchant", "name"]);
        const amount = parseAmount(cell(row, ["amount", "debit", "credit"]));
        const category = cell(row, ["category"]) || "Uncategorized";
        const mainCategory = cell(row, ["main category", "maincategory"]) || category.split(" - ")[0] || category;

        if (!date || !description || amount <= 0) return null;

        return {
          id: cell(row, ["id", "transaction id"]) || `sheet-row-${index + 2}`,
          date,
          description,
          amount,
          category,
          mainCategory,
          type: inferType(row),
          source: "google-sheets",
        };
      })
      .filter((row): row is FinanceTransaction => row !== null);

    return filterFinanceTransactions(rows, filters);
  }
}
