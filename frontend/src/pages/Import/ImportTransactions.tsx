import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Alert,
  Box,
  Button,
  IconButton,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import UploadFileOutlinedIcon from "@mui/icons-material/UploadFileOutlined";
import { financeApi, ImportTransactionRow } from "@/api/finance.api";
import { useMonthStore, isCurrentMonthYear } from "@/store/monthStore";

type ImportType = "expense" | "income";

interface ParsedImportRow extends ImportTransactionRow {
  sourceLine: number;
}

const sample = `Date\tDescription\tAmount\tCategory\tMain Category
01 Sep 26\tFood Basics\t57.13\tGroceries\tFood
02 Sep 26\tPCC24\t535.00\tMaintenance Fee\tHome`;

function formatMonthLabel(monthYear: string): string {
  const [year, month] = monthYear.split("-").map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });
}

function parseAmount(value: string): number | null {
  const normalized = value.replace(/[$,\s]/g, "").replace(/^\((.*)\)$/, "$1");
  const amount = Number(normalized);
  return Number.isFinite(amount) && amount > 0 ? amount : null;
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

function parseRows(input: string, fallbackType: ImportType, monthYear: string): ParsedImportRow[] {
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
  const groupIndex = header ? indexFor(headers, ["maincategory", "group", "categorygroup"]) : 4;
  const typeIndex = header ? indexFor(headers, ["type"]) : -1;

  return dataLines.flatMap((line, index) => {
    const cells = line.split("\t").map((cell) => cell.trim());
    const date = parseDate(cells[dateIndex] ?? "");
    const amount = parseAmount(cells[amountIndex] ?? "");
    const description = cells[descriptionIndex] ?? "";
    if (!date || amount === null || !description) return [];

    const typeValue = (typeIndex >= 0 ? cells[typeIndex] : fallbackType).toLowerCase();
    const type: ImportType = typeValue.includes("income") ? "income" : typeValue.includes("expense") ? "expense" : fallbackType;

    return [{
      sourceLine: header ? index + 2 : index + 1,
      date,
      monthYear,
      description,
      amount,
      type,
      categoryName: cells[categoryIndex] || null,
      groupName: cells[groupIndex] || null,
      currency: "CAD",
    }];
  });
}

function money(value: number): string {
  return value.toLocaleString("en-US", { style: "currency", currency: "CAD" });
}

export function ImportTransactions() {
  const queryClient = useQueryClient();
  const { month, prevMonth, nextMonth } = useMonthStore();
  const isCurrentMonth = isCurrentMonthYear(month);
  const [text, setText] = useState("");
  const [type, setType] = useState<ImportType>("expense");
  const parsedRows = useMemo(() => parseRows(text, type, month), [text, type, month]);

  const importMutation = useMutation({
    mutationFn: () => financeApi.importTransactions(parsedRows),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["finance"] });
    },
  });

  return (
    <Box>
      <Paper
        variant="outlined"
        sx={{
          p: { xs: 2, md: 3 },
          mb: 2,
          borderRadius: 1,
          borderColor: "rgba(255,255,255,0.08)",
          bgcolor: "#171a23",
          backgroundImage: "linear-gradient(135deg, rgba(88,101,242,0.16), rgba(255,107,44,0.12) 44%, rgba(255,255,255,0.03))",
        }}
      >
        <Typography variant="overline" color="primary.main" sx={{ fontWeight: 900 }}>Sheets import</Typography>
        <Typography variant="h1" sx={{ fontWeight: 900 }}>Paste transactions</Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mt: 1, maxWidth: 720 }}>
          Paste rows copied from Google Sheets. Missing category groups and categories are created during import.
        </Typography>
      </Paper>

      <Paper variant="outlined" sx={{ p: 2, mb: 2, borderRadius: 1, borderColor: "rgba(255,255,255,0.08)", bgcolor: "rgba(32,35,45,0.94)" }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2, flexWrap: "wrap", mb: 1.5 }}>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 900 }}>Paste area</Typography>
            <Typography variant="caption" color="text.secondary">
              Supports headers like Date, Description, Amount, Category, Main Category. Imported rows report into {formatMonthLabel(month)}.
            </Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 0.5,
                px: 1,
                py: 0.25,
                border: "1px solid",
                borderColor: "rgba(255,255,255,0.1)",
                borderRadius: 1,
                bgcolor: "rgba(15,17,23,0.48)",
              }}
            >
              <IconButton size="small" onClick={prevMonth}>
                <ChevronLeftIcon fontSize="small" />
              </IconButton>
              <Typography variant="body2" sx={{ fontWeight: 800, minWidth: 132, textAlign: "center" }}>
                {formatMonthLabel(month)}
              </Typography>
              <IconButton size="small" onClick={nextMonth} disabled={isCurrentMonth}>
                <ChevronRightIcon fontSize="small" />
              </IconButton>
            </Box>
            <Select size="small" value={type} onChange={(event) => setType(event.target.value as ImportType)}>
              <MenuItem value="expense">Expense default</MenuItem>
              <MenuItem value="income">Income default</MenuItem>
            </Select>
            <Button size="small" variant="outlined" onClick={() => setText(sample)}>Use sample</Button>
          </Box>
        </Box>

        <TextField
          multiline
          minRows={9}
          fullWidth
          placeholder={sample}
          value={text}
          onChange={(event) => setText(event.target.value)}
        />

        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 2, mt: 2, flexWrap: "wrap" }}>
          <Typography variant="body2" color="text.secondary">
            {parsedRows.length} valid rows ready
          </Typography>
          <Button
            variant="contained"
            startIcon={<UploadFileOutlinedIcon />}
            disabled={parsedRows.length === 0 || importMutation.isPending}
            onClick={() => void importMutation.mutate()}
          >
            {importMutation.isPending ? "Importing..." : "Import rows"}
          </Button>
        </Box>
      </Paper>

      {importMutation.isError && <Alert severity="error" sx={{ mb: 2 }}>Import failed. Check the pasted rows and try again.</Alert>}
      {importMutation.data && (
        <Alert severity="success" sx={{ mb: 2 }}>
          Imported {importMutation.data.transactions.length} transactions. Created {importMutation.data.createdGroups} groups and {importMutation.data.createdCategories} categories.
        </Alert>
      )}

      <Paper variant="outlined" sx={{ overflow: "hidden", borderRadius: 1, borderColor: "rgba(255,255,255,0.08)", bgcolor: "rgba(32,35,45,0.94)" }}>
        <Box sx={{ px: 1.5, py: 1.25, borderBottom: "1px solid", borderColor: "rgba(255,255,255,0.08)", bgcolor: "rgba(15,17,23,0.36)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Typography variant="h5" sx={{ fontWeight: 900 }}>Preview</Typography>
          <Typography variant="caption" color="text.secondary">{parsedRows.length} rows</Typography>
        </Box>
        <TableContainer sx={{ maxHeight: "calc(100vh - 520px)" }}>
          <Table stickyHeader size="small" sx={{ minWidth: 860 }}>
            <TableHead>
              <TableRow>
                <TableCell sx={{ width: 80 }}>Line</TableCell>
                <TableCell sx={{ width: 130 }}>Date</TableCell>
                <TableCell sx={{ width: 150 }}>Reporting month</TableCell>
                <TableCell>Description</TableCell>
                <TableCell align="right" sx={{ width: 120 }}>Amount</TableCell>
                <TableCell sx={{ width: 120 }}>Type</TableCell>
                <TableCell sx={{ width: 180 }}>Group</TableCell>
                <TableCell sx={{ width: 180 }}>Category</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {parsedRows.slice(0, 100).map((row) => (
                <TableRow key={`${row.sourceLine}-${row.description}`} hover>
                  <TableCell>{row.sourceLine}</TableCell>
                  <TableCell>{row.date}</TableCell>
                  <TableCell>{formatMonthLabel(row.monthYear ?? month)}</TableCell>
                  <TableCell>{row.description}</TableCell>
                  <TableCell align="right">{money(row.amount)}</TableCell>
                  <TableCell>{row.type}</TableCell>
                  <TableCell>{row.groupName || "No group"}</TableCell>
                  <TableCell>{row.categoryName || "Uncategorized"}</TableCell>
                </TableRow>
              ))}
              {parsedRows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8}>
                    <Typography color="text.secondary" sx={{ py: 3, textAlign: "center" }}>
                      Paste transactions to preview import rows.
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
}
