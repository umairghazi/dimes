import { ImportTransactionRow } from "@/api/finance.api";

export type ImportType = "expense" | "income";

export interface ParsedImportRow extends ImportTransactionRow {
  sourceLine: number;
}

export const importSample = `Date\tDescription\tAmount\tCategory
01 Sep 26\tFood Basics\t57.13\tGroceries
02 Sep 26\tPCC24\t535.00\tHome - Maintenance Fee`;

function parseAmount(value: string): number | null {
  const normalized = value.replace(/[$,\s]/g, "").replace(/^\((.*)\)$/, "-$1");
  const amount = Number(normalized);
  return normalized !== "" && Number.isFinite(amount) && amount !== 0 ? amount : null;
}

function parseDate(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;

  const withoutOrdinal = trimmed.replace(/(\d+)(st|nd|rd|th)/gi, "$1");
  const parsed = new Date(withoutOrdinal);
  if (Number.isNaN(parsed.getTime())) return null;

  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, "0");
  const day = String(parsed.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function normalizeHeader(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, "");
}

function hasHeader(cells: string[]): boolean {
  const normalized = cells.map(normalizeHeader);
  return normalized.includes("date") && (normalized.includes("amount") || normalized.includes("actual"));
}

function indexFor(headers: string[], names: string[]): number {
  return headers.findIndex((header) => names.includes(normalizeHeader(header)));
}

export function parseImportRows(input: string, fallbackType: ImportType, monthYear: string): ParsedImportRow[] {
  const lines = input.split(/\r?\n/).filter((line) => line.trim());
  if (lines.length === 0) return [];

  const firstCells = lines[0].split("\t").map((cell) => cell.trim());
  const header = hasHeader(firstCells) ? firstCells : null;
  const dataLines = header ? lines.slice(1) : lines;
  const headers = header ?? [];

  const dateIndex = header ? indexFor(headers, ["date"]) : 0;
  const descriptionIndex = header ? indexFor(headers, ["description", "desc", "merchant"]) : fallbackType === "expense" ? 1 : 2;
  const amountIndex = header ? indexFor(headers, ["amount", "actual"]) : fallbackType === "expense" ? 2 : 1;
  const categoryIndex = header ? indexFor(headers, ["category"]) : 3;
  const typeIndex = header ? indexFor(headers, ["type"]) : -1;

  return dataLines.flatMap((line, index) => {
    const cells = line.split("\t").map((cell) => cell.trim());
    const date = parseDate(cells[dateIndex] ?? "");
    const amount = parseAmount(cells[amountIndex] ?? "");
    const description = cells[descriptionIndex] ?? "";
    if (!date || amount === null || !description) return [];

    const typeValue = (typeIndex >= 0 ? cells[typeIndex] : fallbackType).toLowerCase();
    const baseType = typeValue.includes("income") ? "income" : typeValue.includes("expense") || typeValue.includes("refund") ? "expense" : fallbackType;
    if (baseType === "income" && amount < 0) return [];
    const type = baseType === "expense" && (amount < 0 || typeValue.includes("refund")) ? "expense_refund" : baseType;

    return [{
      sourceLine: header ? index + 2 : index + 1,
      date,
      monthYear,
      description,
      amount: Math.abs(amount),
      type,
      categoryName: cells[categoryIndex] || null,
      parentName: null,
      currency: "CAD",
    }];
  });
}

function importRowKey(row: ImportTransactionRow): string {
  return [
    row.date.slice(0, 10),
    row.monthYear ?? row.date.slice(0, 7),
    row.description.trim().toLowerCase().replace(/\s+/g, " "),
    row.amount.toFixed(2),
    row.type,
  ].join("::");
}

export function findDuplicateImportLines(rows: ParsedImportRow[]): Set<number> {
  const seen = new Map<string, number>();
  const duplicates = new Set<number>();

  rows.forEach((row) => {
    const key = importRowKey(row);
    const firstLine = seen.get(key);
    if (firstLine !== undefined) {
      duplicates.add(firstLine);
      duplicates.add(row.sourceLine);
    } else {
      seen.set(key, row.sourceLine);
    }
  });

  return duplicates;
}
