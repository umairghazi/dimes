import Papa from "papaparse";
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

type SheetRow = Record<string, string | undefined>;

function normalizeHeader(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function getCell(row: SheetRow, names: string[]): string {
  const normalized = new Map(
    Object.entries(row).map(([key, value]) => [normalizeHeader(key), value ?? ""]),
  );

  for (const name of names) {
    const value = normalized.get(normalizeHeader(name));
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
  const explicit = getCell(row, ["type", "transaction type"]);
  if (explicit.toLowerCase() === "income") return "income";
  if (explicit.toLowerCase() === "expense") return "expense";

  const section = getCell(row, ["section", "table"]);
  if (section.toLowerCase() === "income") return "income";

  return "expense";
}

function csvUrl(): string | null {
  if (env.GOOGLE_SHEETS_TRANSACTIONS_CSV_URL) return env.GOOGLE_SHEETS_TRANSACTIONS_CSV_URL;
  if (!env.GOOGLE_SHEETS_SPREADSHEET_ID) return null;

  const sheetName = encodeURIComponent(env.GOOGLE_SHEETS_TRANSACTIONS_TAB);
  return `https://docs.google.com/spreadsheets/d/${env.GOOGLE_SHEETS_SPREADSHEET_ID}/gviz/tq?tqx=out:csv&sheet=${sheetName}`;
}

export class GoogleSheetsFinanceDataSource implements FinanceDataSource {
  status(): FinanceDataSourceStatus {
    return {
      provider: "google-sheets",
      configured: csvUrl() !== null,
      readOnly: true,
      details: {
        transactionsTab: env.GOOGLE_SHEETS_TRANSACTIONS_TAB,
        hasCsvUrl: Boolean(env.GOOGLE_SHEETS_TRANSACTIONS_CSV_URL),
        hasSpreadsheetId: Boolean(env.GOOGLE_SHEETS_SPREADSHEET_ID),
      },
    };
  }

  async listTransactions(_userId: string, filters: FinanceTransactionFilters = {}): Promise<FinanceTransaction[]> {
    const url = csvUrl();
    if (!url) {
      throw new AppError("Google Sheets data source is not configured", 503, "DATA_SOURCE_NOT_CONFIGURED");
    }

    const response = await fetch(url);
    if (!response.ok) {
      throw new AppError(`Google Sheets fetch failed with ${response.status}`, 502, "GOOGLE_SHEETS_FETCH_FAILED");
    }

    const csv = await response.text();
    const parsed = Papa.parse<SheetRow>(csv, { header: true, skipEmptyLines: true });
    if (parsed.errors.length > 0) {
      throw new AppError(`Google Sheets CSV parse failed: ${parsed.errors[0].message}`, 502, "GOOGLE_SHEETS_PARSE_FAILED");
    }

    const rows = parsed.data
      .map((row, index): FinanceTransaction | null => {
        const date = parseDate(getCell(row, ["date", "transaction date"]));
        const description = getCell(row, ["description", "merchant", "name"]);
        const amount = parseAmount(getCell(row, ["amount", "debit", "credit"]));
        const category = getCell(row, ["category"]) || "Uncategorized";
        const mainCategory = getCell(row, ["main category", "maincategory"]) || category.split(" - ")[0] || category;

        if (!date || !description || amount <= 0) return null;

        return {
          id: getCell(row, ["id", "transaction id"]) || `sheet-row-${index + 2}`,
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
