import { useMemo, useState } from "react";
import {
  Box,
  Button,
  Checkbox,
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
  Tooltip,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import SellIcon from "@mui/icons-material/Sell";
import { FinanceCategory } from "@/api/finance.api";
import { Expense } from "@/types/expense.types";

type LedgerKind = "expense" | "income";

interface DraftRow {
  date: string;
  description: string;
  amount: string;
  categoryId: string;
}

interface LedgerTableProps {
  title: string;
  kind: LedgerKind;
  rows: Expense[];
  categories: FinanceCategory[];
  defaultDate: string;
  onCreate: (draft: { date: string; description: string; amount: number; categoryId?: string | null; type: LedgerKind }) => Promise<void>;
  onUpdate: (id: string, patch: Partial<Expense> & { categoryId?: string | null }) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

interface ParsedPasteRow {
  date: string;
  description: string;
  amount: number;
  categoryId?: string | null;
}

const blankDraft = (date: string): DraftRow => ({
  date,
  description: "",
  amount: "",
  categoryId: "",
});

function toInputDate(value: string): string {
  return value.slice(0, 10);
}

function money(value: number): string {
  return value.toFixed(2);
}

function normalizeCategoryName(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function parseAmount(value: string): number | null {
  const clean = value.replace(/[$,\s]/g, "").replace(/^\((.*)\)$/, "$1");
  const amount = Number(clean);
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

function parsePastedRows(text: string, kind: LedgerKind, categories: FinanceCategory[]): ParsedPasteRow[] {
  const categoryByName = new Map(categories.map((c) => [normalizeCategoryName(c.name), c.id]));
  const parsedRows: ParsedPasteRow[] = [];

  text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.split("\t").map((cell) => cell.trim()))
    .forEach((cells) => {
      const [dateRaw, secondRaw, thirdRaw, fourthRaw] = cells;
      const date = parseDate(dateRaw ?? "");
      const amount = parseAmount(kind === "expense" ? thirdRaw ?? "" : secondRaw ?? "");
      const description = kind === "expense" ? secondRaw : thirdRaw;
      const category = fourthRaw ?? "";

      if (!date || amount === null || !description?.trim()) return;

      parsedRows.push({
        date,
        description: description.trim(),
        amount,
        categoryId: categoryByName.get(normalizeCategoryName(category)) ?? null,
      });
    });

  return parsedRows;
}

export function LedgerTable({
  title,
  kind,
  rows,
  categories,
  defaultDate,
  onCreate,
  onUpdate,
  onDelete,
}: LedgerTableProps) {
  const [editing, setEditing] = useState<Record<string, Partial<DraftRow>>>({});
  const [draft, setDraft] = useState<DraftRow>(() => blankDraft(defaultDate));
  const [savingId, setSavingId] = useState<string | null>(null);
  const [pasteCount, setPasteCount] = useState<number | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const [bulkCategoryId, setBulkCategoryId] = useState("");

  const options = useMemo(
    () => categories.filter((c) => (c.type ?? "expense") === kind),
    [categories, kind],
  );
  const selectedCount = selectedIds.size;
  const allVisibleSelected = rows.length > 0 && rows.every((row) => selectedIds.has(row.id));

  const toggleAll = (checked: boolean) => {
    setSelectedIds(checked ? new Set(rows.map((row) => row.id)) : new Set());
  };

  const toggleRow = (id: string, checked: boolean) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const bulkDelete = async () => {
    const ids = [...selectedIds];
    for (const id of ids) {
      await onDelete(id);
    }
    setSelectedIds(new Set());
  };

  const bulkApplyCategory = async () => {
    const ids = [...selectedIds];
    for (const id of ids) {
      await onUpdate(id, { categoryId: bulkCategoryId || null });
    }
    setBulkCategoryId("");
    setSelectedIds(new Set());
  };

  const displayValue = (row: Expense, field: keyof DraftRow): string => {
    const edited = editing[row.id]?.[field];
    if (edited !== undefined) return edited;
    if (field === "date") return toInputDate(row.date);
    if (field === "amount") return money(row.amount);
    if (field === "categoryId") return row.categoryId ?? "";
    return row.description;
  };

  const setCell = (id: string, field: keyof DraftRow, value: string) => {
    setEditing((current) => ({
      ...current,
      [id]: { ...current[id], [field]: value },
    }));
  };

  const commitCell = async (row: Expense, field: keyof DraftRow) => {
    const next = editing[row.id]?.[field];
    if (next === undefined) return;

    const patch: Partial<Expense> & { categoryId?: string | null } = {};
    if (field === "date" && next !== toInputDate(row.date)) patch.date = next;
    if (field === "description" && next.trim() && next.trim() !== row.description) patch.description = next.trim();
    if (field === "amount") {
      const amount = Number(next);
      if (!Number.isFinite(amount) || amount <= 0) return;
      if (amount !== row.amount) patch.amount = amount;
    }
    if (field === "categoryId" && next !== (row.categoryId ?? "")) patch.categoryId = next || null;

    setEditing((current) => {
      const rowEdit = { ...current[row.id] };
      delete rowEdit[field];
      return { ...current, [row.id]: rowEdit };
    });

    if (Object.keys(patch).length === 0) return;
    setSavingId(row.id);
    try {
      await onUpdate(row.id, patch);
    } finally {
      setSavingId(null);
    }
  };

  const handleKeyDown = async (
    event: React.KeyboardEvent<HTMLElement>,
    row: Expense,
    field: keyof DraftRow,
  ) => {
    if (event.key === "Enter") {
      event.preventDefault();
      await commitCell(row, field);
      const nextRow = event.currentTarget.closest("tr")?.nextElementSibling as HTMLTableRowElement | null;
      const nextInput = nextRow?.querySelector<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(
        `[data-ledger-field="${field}"]`,
      );
      nextInput?.focus();
    }
    if (event.key === "Escape") {
      setEditing((current) => {
        const rowEdit = { ...current[row.id] };
        delete rowEdit[field];
        return { ...current, [row.id]: rowEdit };
      });
    }
  };

  const addDraft = async () => {
    const amount = Number(draft.amount);
    if (!draft.date || !draft.description.trim() || !Number.isFinite(amount) || amount <= 0) return;
    await onCreate({
      date: draft.date,
      description: draft.description.trim(),
      amount,
      categoryId: draft.categoryId || null,
      type: kind,
    });
    setDraft(blankDraft(draft.date));
  };

  const handlePaste = async (event: React.ClipboardEvent<HTMLElement>) => {
    const text = event.clipboardData.getData("text/plain");
    if (!text.includes("\t") && !text.includes("\n")) return;

    const parsed = parsePastedRows(text, kind, options);
    if (parsed.length === 0) return;

    event.preventDefault();
    for (const row of parsed) {
      await onCreate({ ...row, type: kind });
    }
    setPasteCount(parsed.length);
    setDraft(blankDraft(parsed[parsed.length - 1]?.date ?? draft.date));
  };

  const maybeAddOnEnter = async (event: React.KeyboardEvent<HTMLElement>) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    await addDraft();
  };

  return (
    <Paper
      variant="outlined"
      sx={{
        overflow: "hidden",
        borderRadius: 1,
        borderColor: "divider",
        bgcolor: "background.paper",
      }}
    >
      <Box sx={{ px: 1.5, py: 1.25, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1.5, borderBottom: "1px solid", borderColor: "divider" }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 900, color: kind === "expense" ? "primary.main" : "success.main" }}>
            {title}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {kind === "expense" ? "Date, description, amount, category" : "Date, amount, description, category"}
          </Typography>
        </Box>
        {selectedCount > 0 ? (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 0 }}>
            <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: "nowrap" }}>
              {selectedCount} selected
            </Typography>
            <Select
              size="small"
              value={bulkCategoryId}
              displayEmpty
              onChange={(e) => setBulkCategoryId(e.target.value)}
              sx={{ minWidth: 150, height: 30 }}
            >
              <MenuItem value="">Uncategorized</MenuItem>
              {options.map((category) => (
                <MenuItem key={category.id} value={category.id}>
                  {category.name}
                </MenuItem>
              ))}
            </Select>
            <Tooltip title="Apply category">
              <span>
                <IconButton size="small" color="primary" onClick={() => void bulkApplyCategory()}>
                  <SellIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
            <Button size="small" color="error" onClick={() => void bulkDelete()}>
              Delete
            </Button>
          </Box>
        ) : (
          <Typography variant="caption" color="text.secondary">
            {pasteCount ? `${pasteCount} pasted` : `${rows.length} rows`}
          </Typography>
        )}
      </Box>

      <TableContainer sx={{ maxHeight: "calc(100vh - 218px)", overflowX: "auto" }}>
        <Table
          stickyHeader
          size="small"
          sx={{
            tableLayout: "fixed",
            minWidth: kind === "expense" ? 850 : 650,
            "& .MuiTableCell-root": {
              borderColor: (theme) => theme.palette.mode === "dark" ? "rgba(255,255,255,0.08)" : "rgba(18,16,13,0.09)",
              px: 0.9,
              py: 0.45,
              height: 38,
            },
            "& .MuiTableCell-head": {
              bgcolor: (theme) => theme.palette.mode === "dark" ? "rgba(32,36,44,0.98)" : "rgba(248,245,240,0.98)",
              color: "text.secondary",
              fontWeight: 900,
              textTransform: "none",
            },
            "& .MuiTableRow-root:hover .MuiTableCell-body": {
              backgroundColor: (theme) => theme.palette.mode === "dark" ? "rgba(255,135,92,0.07)" : "rgba(255,90,31,0.045)",
            },
            "& .MuiInputBase-root": {
              fontSize: "0.875rem",
              color: "text.primary",
              fontWeight: 580,
            },
            "& .MuiInputBase-input": {
              py: 0.25,
            },
            "& .MuiInput-underline:before": {
              borderBottomColor: "transparent",
            },
            "& .MuiInput-underline:hover:before": {
              borderBottomColor: "divider",
            },
          }}
        >
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox" sx={{ width: 34 }}>
                <Checkbox
                  size="small"
                  checked={allVisibleSelected}
                  indeterminate={selectedCount > 0 && !allVisibleSelected}
                  onChange={(e) => toggleAll(e.target.checked)}
                />
              </TableCell>
              <TableCell sx={{ width: 150 }}>Date</TableCell>
              {kind === "expense" ? (
                <>
                  <TableCell sx={{ width: 230 }}>Description</TableCell>
                  <TableCell align="right" sx={{ width: 110 }}>Amount</TableCell>
                </>
              ) : (
                <>
                  <TableCell align="right" sx={{ width: 110 }}>Amount</TableCell>
                  <TableCell sx={{ width: 230 }}>Description</TableCell>
                </>
              )}
              <TableCell sx={{ width: 220 }}>Category</TableCell>
              {kind === "expense" && <TableCell sx={{ width: 160 }}>Main Category</TableCell>}
              <TableCell sx={{ width: 38 }} />
            </TableRow>
          </TableHead>

          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id} hover sx={{ opacity: savingId === row.id ? 0.55 : 1 }}>
                <TableCell padding="checkbox">
                  <Checkbox
                    size="small"
                    checked={selectedIds.has(row.id)}
                    onChange={(e) => toggleRow(row.id, e.target.checked)}
                  />
                </TableCell>
                <TableCell>
                  <TextField
                    data-ledger-field="date"
                    type="date"
                    size="small"
                    variant="standard"
                    fullWidth
                    value={displayValue(row, "date")}
                    slotProps={{ htmlInput: { style: { minWidth: 126 } } }}
                    onChange={(e) => setCell(row.id, "date", e.target.value)}
                    onBlur={() => void commitCell(row, "date")}
                    onKeyDown={(e) => void handleKeyDown(e, row, "date")}
                  />
                </TableCell>
                {kind === "expense" ? (
                  <>
                    <TableCell>
                      <TextField
                        data-ledger-field="description"
                        size="small"
                        variant="standard"
                        fullWidth
                        value={displayValue(row, "description")}
                        onChange={(e) => setCell(row.id, "description", e.target.value)}
                        onBlur={() => void commitCell(row, "description")}
                        onKeyDown={(e) => void handleKeyDown(e, row, "description")}
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        data-ledger-field="amount"
                        type="number"
                        size="small"
                        variant="standard"
                        fullWidth
                        value={displayValue(row, "amount")}
                        slotProps={{ htmlInput: { min: 0, step: "0.01", style: { textAlign: "right" } } }}
                        onChange={(e) => setCell(row.id, "amount", e.target.value)}
                        onBlur={() => void commitCell(row, "amount")}
                        onKeyDown={(e) => void handleKeyDown(e, row, "amount")}
                      />
                    </TableCell>
                  </>
                ) : (
                  <>
                    <TableCell>
                      <TextField
                        data-ledger-field="amount"
                        type="number"
                        size="small"
                        variant="standard"
                        fullWidth
                        value={displayValue(row, "amount")}
                        slotProps={{ htmlInput: { min: 0, step: "0.01", style: { textAlign: "right" } } }}
                        onChange={(e) => setCell(row.id, "amount", e.target.value)}
                        onBlur={() => void commitCell(row, "amount")}
                        onKeyDown={(e) => void handleKeyDown(e, row, "amount")}
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        data-ledger-field="description"
                        size="small"
                        variant="standard"
                        fullWidth
                        value={displayValue(row, "description")}
                        onChange={(e) => setCell(row.id, "description", e.target.value)}
                        onBlur={() => void commitCell(row, "description")}
                        onKeyDown={(e) => void handleKeyDown(e, row, "description")}
                      />
                    </TableCell>
                  </>
                )}
                <TableCell>
                  <Select
                    data-ledger-field="categoryId"
                    size="small"
                    variant="standard"
                    fullWidth
                    displayEmpty
                    value={displayValue(row, "categoryId")}
                    onChange={(e) => {
                      setCell(row.id, "categoryId", e.target.value);
                      void onUpdate(row.id, { categoryId: e.target.value || null });
                    }}
                  >
                    <MenuItem value="">Uncategorized</MenuItem>
                    {options.map((category) => (
                      <MenuItem key={category.id} value={category.id}>
                        {category.name}
                      </MenuItem>
                    ))}
                  </Select>
                </TableCell>
                {kind === "expense" && (
                  <TableCell>
                    <Typography
                      variant="body2"
                      sx={{
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        color: "text.secondary",
                      }}
                    >
                      {row.mainCategory || "Uncategorized"}
                    </Typography>
                  </TableCell>
                )}
                <TableCell align="center">
                  <Tooltip title="Delete row">
                    <IconButton size="small" onClick={() => void onDelete(row.id)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}

            <TableRow sx={{ bgcolor: (theme) => theme.palette.mode === "dark" ? "rgba(255,255,255,0.035)" : "rgba(18,16,13,0.035)" }}>
              <TableCell padding="checkbox" />
              <TableCell>
                <TextField
                  type="date"
                  size="small"
                  variant="standard"
                  fullWidth
                  value={draft.date}
                  slotProps={{ htmlInput: { style: { minWidth: 126 } } }}
                  onChange={(e) => setDraft((d) => ({ ...d, date: e.target.value }))}
                  onKeyDown={maybeAddOnEnter}
                  onPaste={handlePaste}
                />
              </TableCell>
              {kind === "expense" ? (
                <>
                  <TableCell>
                    <TextField
                      size="small"
                      variant="standard"
                      fullWidth
                      placeholder="Add description"
                      value={draft.description}
                      onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
                      onKeyDown={maybeAddOnEnter}
                      onPaste={handlePaste}
                    />
                  </TableCell>
                  <TableCell>
                    <TextField
                      type="number"
                      size="small"
                      variant="standard"
                      fullWidth
                      placeholder="0.00"
                      value={draft.amount}
                      slotProps={{ htmlInput: { min: 0, step: "0.01", style: { textAlign: "right" } } }}
                      onChange={(e) => setDraft((d) => ({ ...d, amount: e.target.value }))}
                      onKeyDown={maybeAddOnEnter}
                      onPaste={handlePaste}
                    />
                  </TableCell>
                </>
              ) : (
                <>
                  <TableCell>
                    <TextField
                      type="number"
                      size="small"
                      variant="standard"
                      fullWidth
                      placeholder="0.00"
                      value={draft.amount}
                      slotProps={{ htmlInput: { min: 0, step: "0.01", style: { textAlign: "right" } } }}
                      onChange={(e) => setDraft((d) => ({ ...d, amount: e.target.value }))}
                      onKeyDown={maybeAddOnEnter}
                      onPaste={handlePaste}
                    />
                  </TableCell>
                  <TableCell>
                    <TextField
                      size="small"
                      variant="standard"
                      fullWidth
                      placeholder="Add description"
                      value={draft.description}
                      onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
                      onKeyDown={maybeAddOnEnter}
                      onPaste={handlePaste}
                    />
                  </TableCell>
                </>
              )}
              <TableCell>
                <Select
                  size="small"
                  variant="standard"
                  fullWidth
                  displayEmpty
                  value={draft.categoryId}
                  onChange={(e) => setDraft((d) => ({ ...d, categoryId: e.target.value }))}
                >
                  <MenuItem value="">Uncategorized</MenuItem>
                  {options.map((category) => (
                    <MenuItem key={category.id} value={category.id}>
                      {category.name}
                    </MenuItem>
                  ))}
                </Select>
              </TableCell>
              {kind === "expense" && (
                <TableCell>
                  <Typography variant="body2" color="text.secondary">
                    {options.find((category) => category.id === draft.categoryId)?.mainCategory || ""}
                  </Typography>
                </TableCell>
              )}
              <TableCell align="center">
                <Tooltip title="Add row">
                  <IconButton size="small" color="primary" onClick={() => void addDraft()}>
                    <AddIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
}
