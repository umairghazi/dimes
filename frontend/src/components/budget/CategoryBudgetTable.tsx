import { useState, useRef } from "react";
import {
  Box, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Typography, IconButton, Tooltip,
  TextField, Collapse, Chip, CircularProgress, Autocomplete,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import RepeatIcon from "@mui/icons-material/Repeat";
import ArchiveIcon from "@mui/icons-material/Archive";
import UnarchiveIcon from "@mui/icons-material/Unarchive";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import { useCategories } from "@/hooks/useCategories";
import { useBudgets } from "@/hooks/useBudgets";
import { usePreferencesStore } from "@/store/preferencesStore";
import { useAnalyticsStore } from "@/store/analyticsStore";
import { UserCategory } from "@/types/category.types";
import { Budget } from "@/types/budget.types";

interface Props {
  spentMap: Map<string, number>;
}

function fmt(n: number) {
  return "$" + n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function RemainingCell({ budget, spent }: { budget: Budget | null; spent: number }) {
  if (!budget) return <TableCell align="right" sx={{ color: "text.disabled" }}>—</TableCell>;
  const remaining = budget.limitAmount - spent;
  const pct = spent / budget.limitAmount;
  const color = pct >= 1 ? "error.main" : pct >= 0.85 ? "warning.main" : "success.main";
  return (
    <TableCell align="right" sx={{ color, fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>
      {remaining >= 0 ? fmt(remaining) : `-${fmt(Math.abs(remaining))}`}
    </TableCell>
  );
}

export function CategoryBudgetTable({ spentMap }: Props) {
  const { categories, loading: catLoading, addCategory, updateCategory, deleteCategory, restoreCategory } =
    useCategories({ includeDeleted: true });
  const { budgets, loading: budgetLoading, createBudget, updateBudget, deleteBudget } = useBudgets();
  const { currency } = usePreferencesStore();
  const { month } = useAnalyticsStore();

  // ── inline name edit ──
  const [editNameId, setEditNameId] = useState<string | null>(null);
  const [editNameVal, setEditNameVal] = useState("");
  const [editNameSaving, setEditNameSaving] = useState(false);

  // ── inline budget edit ──
  const [editBudgetId, setEditBudgetId] = useState<string | null>(null);
  const [editBudgetVal, setEditBudgetVal] = useState("");
  const [editBudgetSaving, setEditBudgetSaving] = useState(false);

  // ── add new row ──
  const [adding, setAdding] = useState(false);
  const [addName, setAddName] = useState("");
  const [addGroup, setAddGroup] = useState("");
  const [addSaving, setAddSaving] = useState(false);
  const addNameRef = useRef<HTMLInputElement>(null);

  // ── archived section ──
  const [archiveOpen, setArchiveOpen] = useState(false);

  const loading = catLoading || budgetLoading;

  const active = categories.filter((c) => !c.deletedAt);
  const archived = categories.filter((c) => c.deletedAt);

  const budgetMap = new Map<string, Budget>(
    budgets.filter((b) => b.monthYear === month).map((b) => [b.category, b]),
  );

  const existingGroups = Array.from(
    new Set(active.map((c) => c.group).filter(Boolean) as string[]),
  ).sort();

  // Group active categories
  const groupMap = new Map<string, UserCategory[]>();
  for (const cat of active) {
    const key = cat.group ?? "";
    if (!groupMap.has(key)) groupMap.set(key, []);
    groupMap.get(key)!.push(cat);
  }
  const groups = [
    ...[...groupMap.entries()].filter(([k]) => k !== "").sort(([a], [b]) => a.localeCompare(b)),
    ...(groupMap.has("") ? [["", groupMap.get("")!] as [string, UserCategory[]]] : []),
  ];

  // ── handlers ──

  function startNameEdit(cat: UserCategory) {
    setEditNameId(cat.id);
    setEditNameVal(cat.group ? cat.name.replace(`${cat.group} - `, "") : cat.name);
    setEditBudgetId(null);
  }

  async function saveNameEdit(cat: UserCategory) {
    const trimmed = editNameVal.trim();
    if (!trimmed || trimmed === (cat.group ? cat.name.replace(`${cat.group} - `, "") : cat.name)) {
      setEditNameId(null);
      return;
    }
    setEditNameSaving(true);
    try {
      await updateCategory(cat.id, { name: trimmed, group: cat.group });
    } finally {
      setEditNameSaving(false);
      setEditNameId(null);
    }
  }

  function startBudgetEdit(cat: UserCategory) {
    const budget = budgetMap.get(cat.name);
    setEditBudgetId(cat.id);
    setEditBudgetVal(budget ? String(Math.round(budget.limitAmount)) : "");
    setEditNameId(null);
  }

  async function saveBudgetEdit(cat: UserCategory) {
    const val = parseFloat(editBudgetVal);
    const existing = budgetMap.get(cat.name);
    setEditBudgetSaving(true);
    try {
      if (editBudgetVal.trim() === "" && existing) {
        await deleteBudget(existing.id);
      } else if (!isNaN(val) && val >= 0) {
        if (existing) {
          await updateBudget(existing.id, { limitAmount: val });
        } else {
          await createBudget({ category: cat.name, monthYear: month, limitAmount: val, currency, carryForward: true });
        }
      }
    } finally {
      setEditBudgetSaving(false);
      setEditBudgetId(null);
    }
  }

  async function toggleCarryForward(cat: UserCategory) {
    const budget = budgetMap.get(cat.name);
    if (!budget) return;
    await updateBudget(budget.id, { carryForward: !budget.carryForward });
  }

  async function archiveCategory(cat: UserCategory) {
    const budget = budgetMap.get(cat.name);
    if (budget) await deleteBudget(budget.id);
    await deleteCategory(cat.id);
  }

  async function handleAdd() {
    const name = addName.trim();
    if (!name) return;
    setAddSaving(true);
    try {
      await addCategory(name, addGroup.trim() || undefined);
      setAddName("");
      setAddGroup("");
      setAdding(false);
    } finally {
      setAddSaving(false);
    }
  }

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
        <CircularProgress size={24} />
      </Box>
    );
  }

  return (
    <Box>
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 700 }}>Category</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700, width: 110 }}>Budget/mo</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700, width: 90 }}>Spent</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700, width: 100 }}>Remaining</TableCell>
              <TableCell sx={{ width: 72 }} />
            </TableRow>
          </TableHead>

          <TableBody>
            {groups.map(([group, items]) => (
              <>
                {/* Group header row */}
                {group !== "" && (
                  <TableRow key={`group-${group}`}>
                    <TableCell
                      colSpan={5}
                      sx={{ pt: 2, pb: 0.5, borderBottom: "none" }}
                    >
                      <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: "0.08em" }}>
                        {group}
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}

                {/* Category rows */}
                {items.map((cat) => {
                  const budget = budgetMap.get(cat.name) ?? null;
                  const spent = spentMap.get(cat.name) ?? 0;
                  const displayName = cat.group ? cat.name.replace(`${cat.group} - `, "") : cat.name;
                  const isEditingName = editNameId === cat.id;
                  const isEditingBudget = editBudgetId === cat.id;

                  return (
                    <TableRow key={cat.id} hover sx={{ "& td": { py: 0.75 } }}>
                      {/* Name cell */}
                      <TableCell>
                        {isEditingName ? (
                          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                            <TextField
                              size="small"
                              autoFocus
                              value={editNameVal}
                              onChange={(e) => setEditNameVal(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") void saveNameEdit(cat);
                                if (e.key === "Escape") setEditNameId(null);
                              }}
                              sx={{ width: 160 }}
                              slotProps={{ input: { sx: { fontSize: "0.875rem" } } }}
                            />
                            <IconButton size="small" onClick={() => void saveNameEdit(cat)} disabled={editNameSaving}>
                              {editNameSaving ? <CircularProgress size={14} /> : <CheckIcon sx={{ fontSize: 14 }} />}
                            </IconButton>
                            <IconButton size="small" onClick={() => setEditNameId(null)}>
                              <CloseIcon sx={{ fontSize: 14 }} />
                            </IconButton>
                          </Box>
                        ) : (
                          <Typography
                            variant="body2"
                            onClick={() => startNameEdit(cat)}
                            sx={{ cursor: "text", display: "inline", "&:hover": { textDecoration: "underline", textDecorationStyle: "dotted" } }}
                          >
                            {displayName}
                          </Typography>
                        )}
                      </TableCell>

                      {/* Budget cell */}
                      <TableCell align="right">
                        {isEditingBudget ? (
                          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, justifyContent: "flex-end" }}>
                            <TextField
                              size="small"
                              autoFocus
                              type="number"
                              placeholder="0"
                              value={editBudgetVal}
                              onChange={(e) => setEditBudgetVal(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") void saveBudgetEdit(cat);
                                if (e.key === "Escape") setEditBudgetId(null);
                              }}
                              sx={{ width: 80 }}
                              slotProps={{ input: { sx: { fontSize: "0.875rem" } } }}
                            />
                            <IconButton size="small" onClick={() => void saveBudgetEdit(cat)} disabled={editBudgetSaving}>
                              {editBudgetSaving ? <CircularProgress size={14} /> : <CheckIcon sx={{ fontSize: 14 }} />}
                            </IconButton>
                            <IconButton size="small" onClick={() => setEditBudgetId(null)}>
                              <CloseIcon sx={{ fontSize: 14 }} />
                            </IconButton>
                          </Box>
                        ) : (
                          <Typography
                            variant="body2"
                            onClick={() => startBudgetEdit(cat)}
                            sx={{
                              cursor: "text",
                              color: budget ? "text.primary" : "text.disabled",
                              fontVariantNumeric: "tabular-nums",
                              "&:hover": { textDecoration: "underline", textDecorationStyle: "dotted" },
                            }}
                          >
                            {budget ? fmt(budget.limitAmount) : "—"}
                          </Typography>
                        )}
                      </TableCell>

                      {/* Spent */}
                      <TableCell align="right" sx={{ fontVariantNumeric: "tabular-nums", color: "text.secondary" }}>
                        <Typography variant="body2">{spent > 0 ? fmt(spent) : "—"}</Typography>
                      </TableCell>

                      {/* Remaining */}
                      <RemainingCell budget={budget} spent={spent} />

                      {/* Actions */}
                      <TableCell>
                        <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                          <Tooltip title={
                            !budget ? "Set a budget to enable carry-forward" :
                            budget.carryForward ? "Repeats monthly — click to stop" : "Click to repeat every month"
                          }>
                            <span>
                              <IconButton
                                size="small"
                                disabled={!budget}
                                onClick={() => void toggleCarryForward(cat)}
                                sx={{ color: budget?.carryForward ? "primary.main" : "text.disabled" }}
                              >
                                <RepeatIcon sx={{ fontSize: 16 }} />
                              </IconButton>
                            </span>
                          </Tooltip>
                          <Tooltip title="Archive category">
                            <IconButton size="small" onClick={() => void archiveCategory(cat)} sx={{ color: "text.disabled" }}>
                              <ArchiveIcon sx={{ fontSize: 16 }} />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </>
            ))}

            {/* Add new row */}
            {adding ? (
              <TableRow sx={{ "& td": { py: 1, borderBottom: "none" } }}>
                <TableCell colSpan={3}>
                  <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                    <TextField
                      size="small"
                      autoFocus
                      placeholder="Category name"
                      value={addName}
                      onChange={(e) => setAddName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") void handleAdd();
                        if (e.key === "Escape") { setAdding(false); setAddName(""); setAddGroup(""); }
                      }}
                      inputRef={addNameRef}
                      sx={{ width: 180 }}
                    />
                    <Autocomplete
                      freeSolo
                      options={existingGroups}
                      value={addGroup}
                      onInputChange={(_, val) => setAddGroup(val)}
                      renderInput={(params) => (
                        <TextField {...params} size="small" placeholder="Group (optional)" sx={{ width: 160 }} />
                      )}
                      size="small"
                    />
                  </Box>
                </TableCell>
                <TableCell colSpan={2}>
                  <Box sx={{ display: "flex", gap: 0.5, justifyContent: "flex-end" }}>
                    <IconButton size="small" color="primary" onClick={() => void handleAdd()} disabled={addSaving || !addName.trim()}>
                      {addSaving ? <CircularProgress size={14} /> : <CheckIcon sx={{ fontSize: 14 }} />}
                    </IconButton>
                    <IconButton size="small" onClick={() => { setAdding(false); setAddName(""); setAddGroup(""); }}>
                      <CloseIcon sx={{ fontSize: 14 }} />
                    </IconButton>
                  </Box>
                </TableCell>
              </TableRow>
            ) : (
              <TableRow sx={{ "& td": { borderBottom: "none" } }}>
                <TableCell colSpan={5}>
                  <Typography
                    variant="body2"
                    color="text.disabled"
                    onClick={() => setAdding(true)}
                    sx={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 0.5, py: 0.5, "&:hover": { color: "primary.main" } }}
                  >
                    <AddIcon sx={{ fontSize: 16 }} /> Add category
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Archived section */}
      {archived.length > 0 && (
        <Box sx={{ mt: 2, borderTop: 1, borderColor: "divider", pt: 1 }}>
          <Box
            onClick={() => setArchiveOpen((o) => !o)}
            sx={{ display: "flex", alignItems: "center", gap: 0.5, cursor: "pointer", color: "text.secondary", py: 0.5 }}
          >
            {archiveOpen ? <ExpandLessIcon sx={{ fontSize: 16 }} /> : <ExpandMoreIcon sx={{ fontSize: 16 }} />}
            <Typography variant="caption" sx={{ fontWeight: 600 }}>
              Archived ({archived.length})
            </Typography>
          </Box>
          <Collapse in={archiveOpen}>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mt: 1 }}>
              {archived.map((cat) => (
                <Chip
                  key={cat.id}
                  label={cat.name}
                  size="small"
                  variant="outlined"
                  onDelete={() => void restoreCategory(cat.id)}
                  deleteIcon={
                    <Tooltip title="Restore">
                      <UnarchiveIcon />
                    </Tooltip>
                  }
                  sx={{ color: "text.disabled", borderColor: "divider" }}
                />
              ))}
            </Box>
          </Collapse>
        </Box>
      )}
    </Box>
  );
}
