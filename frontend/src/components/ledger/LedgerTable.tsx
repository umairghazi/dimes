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
import { UserCategory } from "@/types/category.types";

type LedgerKind = "expense" | "income";

export interface LedgerRow {
  id: string;
  date: string;
  description: string;
  amount: number;
  category: string;
  categoryId?: string | null;
  type: LedgerKind;
}

interface DraftRow {
  date: string;
  description: string;
  amount: string;
  categoryId: string;
}

interface LedgerTableProps {
  title: string;
  kind: LedgerKind;
  rows: LedgerRow[];
  categories: UserCategory[];
  defaultDate: string;
  readOnly?: boolean;
  onCreate: (draft: { date: string; description: string; amount: number; categoryId?: string | null; type: LedgerKind }) => Promise<void>;
  onUpdate: (id: string, patch: Partial<LedgerRow> & { categoryId?: string | null }) => Promise<void>;
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

function parsePastedRows(text: string, kind: LedgerKind, categories: UserCategory[]): ParsedPasteRow[] {
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
  readOnly = false,
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

  const displayValue = (row: LedgerRow, field: keyof DraftRow): string => {
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

  const commitCell = async (row: LedgerRow, field: keyof DraftRow) => {
    const next = editing[row.id]?.[field];
    if (next === undefined) return;

    const patch: Partial<LedgerRow> & { categoryId?: string | null } = {};
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
    row: LedgerRow,
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
    <Paper variant="outlined" sx={{ overflow: "hidden", borderRadius: 1 }}>
      <Box sx={{ px: 1.5, py: 1.25, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1.5 }}>
        <Typography variant="h6" sx={{ fontWeight: 800, color: kind === "expense" ? "error.main" : "success.main" }}>
          {title}
        </Typography>
        {readOnly ? (
          <Typography variant="caption" color="text.secondary">
            Read-only source
          </Typography>
        ) : selectedCount > 0 ? (
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

      <TableContainer sx={{ maxHeight: "calc(100vh - 220px)" }}>
        <Table stickyHeader size="small" sx={{ tableLayout: "fixed" }}>
          <TableHead>
            <TableRow>
              {!readOnly && (
                <TableCell padding="checkbox" sx={{ width: 42 }}>
                <Checkbox
                  size="small"
                  checked={allVisibleSelected}
                  indeterminate={selectedCount > 0 && !allVisibleSelected}
                  onChange={(e) => toggleAll(e.target.checked)}
                />
                </TableCell>
              )}
              <TableCell sx={{ width: 118 }}>Date</TableCell>
              {kind === "expense" ? (
                <>
                  <TableCell>Description</TableCell>
                  <TableCell align="right" sx={{ width: 112 }}>Amount</TableCell>
                </>
              ) : (
                <>
                  <TableCell align="right" sx={{ width: 112 }}>Amount</TableCell>
                  <TableCell>Description</TableCell>
                </>
              )}
              <TableCell sx={{ width: 220 }}>Category</TableCell>
              <TableCell sx={{ width: 42 }} />
            </TableRow>
          </TableHead>

          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id} hover sx={{ opacity: savingId === row.id ? 0.55 : 1 }}>
                {!readOnly && (
                  <TableCell padding="checkbox">
                  <Checkbox
                    size="small"
                    checked={selectedIds.has(row.id)}
                    onChange={(e) => toggleRow(row.id, e.target.checked)}
                  />
                  </TableCell>
                )}
                <TableCell>
                  <TextField
                    data-ledger-field="date"
                    type="date"
                    size="small"
                    variant="standard"
                    fullWidth
                    value={displayValue(row, "date")}
                    onChange={(e) => setCell(row.id, "date", e.target.value)}
                    onBlur={() => void commitCell(row, "date")}
                    onKeyDown={(e) => void handleKeyDown(e, row, "date")}
                    disabled={readOnly}
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
                        disabled={readOnly}
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
                        disabled={readOnly}
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
                        disabled={readOnly}
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
                        disabled={readOnly}
                      />
                    </TableCell>
                  </>
                )}
                <TableCell>
                  {readOnly ? (
                    <Typography variant="body2" sx={{ color: "text.secondary" }}>
                      {row.category}
                    </Typography>
                  ) : (
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
                  )}
                </TableCell>
                <TableCell align="center">
                  {!readOnly && (
                    <Tooltip title="Delete row">
                      <IconButton size="small" onClick={() => void onDelete(row.id)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                </TableCell>
              </TableRow>
            ))}

            {!readOnly && (
              <TableRow sx={{ bgcolor: "action.hover" }}>
              <TableCell padding="checkbox" />
              <TableCell>
                <TextField
                  type="date"
                  size="small"
                  variant="standard"
                  fullWidth
                  value={draft.date}
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
              <TableCell align="center">
                <Tooltip title="Add row">
                  <IconButton size="small" color="primary" onClick={() => void addDraft()}>
                    <AddIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
}
