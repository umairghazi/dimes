import { useState } from "react";
import {
  Box,
  Typography,
  Button,
  TextField,
  IconButton,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Autocomplete,
  Grid,
  Card,
  CardContent,
  InputAdornment,
  Tooltip,
  Skeleton,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import RepeatIcon from "@mui/icons-material/Repeat";
import { useCategories } from "@/hooks/useCategories";
import { useBudgets } from "@/hooks/useBudgets";
import { useAnalytics } from "@/hooks/useAnalytics";
import { usePreferencesStore } from "@/store/preferencesStore";
import { UserCategory } from "@/types/category.types";
import { Budget } from "@/types/budget.types";
import { BudgetProgressBar } from "@/components/charts/BudgetProgressBar";

function currentMonthYear() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

// ── main page ─────────────────────────────────────────────────────────────────

export function Categories() {
  const { categories, tree, loading: catLoading, error: catError, addCategory, updateCategory, deleteCategory } =
    useCategories();
  const { budgets, loading: budgetLoading, createBudget, updateBudget, deleteBudget } = useBudgets();
  const { summary } = useAnalytics();
  const { currency } = usePreferencesStore();

  const monthYear = currentMonthYear();

  const budgetMap = new Map<string, Budget>(
    budgets.filter((b) => b.monthYear === monthYear).map((b) => [b.category, b]),
  );
  const spentMap = new Map<string, number>(
    (summary?.byCategory ?? []).map((c) => [c.category, c.amount]),
  );

  // ── add category dialog ──
  const [addOpen, setAddOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newGroup, setNewGroup] = useState("");
  const [saving, setSaving] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  // ── edit category dialog ──
  const [editTarget, setEditTarget] = useState<UserCategory | null>(null);
  const [editName, setEditName] = useState("");
  const [editGroup, setEditGroup] = useState("");
  const [editSaving, setEditSaving] = useState(false);

  // ── delete confirm dialog ──
  const [deleteTarget, setDeleteTarget] = useState<UserCategory | null>(null);
  const [deleting, setDeleting] = useState(false);

  const existingGroups = Array.from(
    new Set(categories.map((c) => c.group).filter(Boolean) as string[]),
  ).sort();

  const handleAdd = async () => {
    const name = newName.trim();
    if (!name) return;
    setSaving(true);
    setAddError(null);
    try {
      await addCategory(name, newGroup.trim() || undefined);
      setNewName("");
      setNewGroup("");
      setAddOpen(false);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to create category";
      setAddError(msg.includes("already exists") ? "Category already exists" : msg);
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (cat: UserCategory) => {
    setEditTarget(cat);
    setEditName(cat.name);
    setEditGroup(cat.group ?? "");
  };

  const handleEdit = async () => {
    if (!editTarget) return;
    setEditSaving(true);
    try {
      await updateCategory(editTarget.id, {
        name: editName.trim(),
        group: editGroup.trim() || null,
      });
      setEditTarget(null);
    } finally {
      setEditSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const budget = budgetMap.get(deleteTarget.name);
      if (budget) await deleteBudget(budget.id);
      await deleteCategory(deleteTarget.id);
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  const handleSetBudget = async (categoryName: string, amount: number) => {
    const existing = budgetMap.get(categoryName);
    if (existing) {
      await updateBudget(existing.id, { limitAmount: amount });
    } else {
      await createBudget({ category: categoryName, monthYear, limitAmount: amount, currency, carryForward: true });
    }
  };

  const handleClearBudget = async (categoryName: string) => {
    const existing = budgetMap.get(categoryName);
    if (existing) await deleteBudget(existing.id);
  };

  const handleToggleCarryForward = async (categoryName: string) => {
    const existing = budgetMap.get(categoryName);
    if (existing) await updateBudget(existing.id, { carryForward: !existing.carryForward });
  };

  const loading = catLoading || budgetLoading;

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>Categories</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setAddOpen(true)}>
          Add Category
        </Button>
      </Box>

      {catError && <Alert severity="error" sx={{ mb: 2 }}>{catError}</Alert>}

      {loading ? (
        <Grid container spacing={2}>
          {Array.from({ length: 6 }).map((_, i) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={i}>
              <Skeleton variant="rectangular" height={160} sx={{ borderRadius: 2 }} />
            </Grid>
          ))}
        </Grid>
      ) : categories.length === 0 ? (
        <Box
          sx={{
            py: 8,
            textAlign: "center",
            border: "2px dashed",
            borderColor: "divider",
            borderRadius: 2,
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>No categories yet</Typography>
          <Typography color="text.secondary" sx={{ mb: 3 }}>
            Add categories to organise your expenses and set monthly budgets.
          </Typography>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setAddOpen(true)}>
            Add your first category
          </Button>
        </Box>
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
          {tree.map((group) => (
            <Box key={group.group ?? "__standalone__"}>
              {group.group !== null && (
                <Typography
                  variant="overline"
                  color="text.secondary"
                  sx={{ fontWeight: 600, mb: 1, display: "block" }}
                >
                  {group.group}
                </Typography>
              )}
              <Grid container spacing={2}>
                {group.items.map((cat) => (
                  <Grid size={{ xs: 12, sm: 6, md: 4 }} key={cat.id}>
                    <CategoryCard
                      cat={cat}
                      budget={budgetMap.get(cat.name) ?? null}
                      spent={spentMap.get(cat.name) ?? 0}
                      onEdit={() => openEdit(cat)}
                      onDelete={() => setDeleteTarget(cat)}
                      onSetBudget={(amount) => void handleSetBudget(cat.name, amount)}
                      onClearBudget={() => void handleClearBudget(cat.name)}
                      onToggleCarryForward={() => void handleToggleCarryForward(cat.name)}
                    />
                  </Grid>
                ))}
              </Grid>
            </Box>
          ))}
        </Box>
      )}

      {/* Add dialog */}
      <Dialog open={addOpen} onClose={() => setAddOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Add Category</DialogTitle>
        <DialogContent sx={{ pt: "16px !important", display: "flex", flexDirection: "column", gap: 2 }}>
          {addError && <Alert severity="error">{addError}</Alert>}
          <TextField
            label="Category name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            autoFocus
            fullWidth
            placeholder="e.g. Groceries"
            onKeyDown={(e) => { if (e.key === "Enter") void handleAdd(); }}
          />
          <Autocomplete
            freeSolo
            options={existingGroups}
            value={newGroup}
            onInputChange={(_, val) => setNewGroup(val)}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Parent group (optional)"
                placeholder="e.g. Car, Bill, Home"
                helperText="Groups related categories together"
              />
            )}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <Button variant="outlined" onClick={() => { setAddOpen(false); setAddError(null); }}>Cancel</Button>
          <Button variant="contained" onClick={() => void handleAdd()} disabled={saving || !newName.trim()}>
            {saving ? "Saving..." : "Add"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit dialog */}
      <Dialog open={!!editTarget} onClose={() => setEditTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Edit Category</DialogTitle>
        <DialogContent sx={{ pt: "16px !important", display: "flex", flexDirection: "column", gap: 2 }}>
          <TextField
            label="Category name"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            autoFocus
            fullWidth
            onKeyDown={(e) => { if (e.key === "Enter") void handleEdit(); }}
          />
          <Autocomplete
            freeSolo
            options={existingGroups}
            value={editGroup}
            onInputChange={(_, val) => setEditGroup(val)}
            renderInput={(params) => (
              <TextField {...params} label="Parent group (optional)" />
            )}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <Button variant="outlined" onClick={() => setEditTarget(null)}>Cancel</Button>
          <Button variant="contained" onClick={() => void handleEdit()} disabled={editSaving || !editName.trim()}>
            {editSaving ? "Saving..." : "Save"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete confirm */}
      <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Delete Category</DialogTitle>
        <DialogContent>
          <Typography>
            Delete <strong>{deleteTarget?.name}</strong>? Existing expenses won&apos;t be affected.
            {budgetMap.has(deleteTarget?.name ?? "") && " Its budget will also be removed."}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <Button variant="outlined" onClick={() => setDeleteTarget(null)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={() => void handleDelete()} disabled={deleting}>
            {deleting ? "Deleting..." : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

// ── CategoryCard ──────────────────────────────────────────────────────────────

interface CategoryCardProps {
  cat: UserCategory;
  budget: Budget | null;
  spent: number;
  onEdit: () => void;
  onDelete: () => void;
  onSetBudget: (amount: number) => void;
  onClearBudget: () => void;
  onToggleCarryForward: () => void;
}

function CategoryCard({ cat, budget, spent, onEdit, onDelete, onSetBudget, onClearBudget, onToggleCarryForward }: CategoryCardProps) {
  const [budgetEditing, setBudgetEditing] = useState(false);
  const [budgetInput, setBudgetInput] = useState("");
  const [budgetSaving, setBudgetSaving] = useState(false);

  const percent = budget ? (spent / budget.limitAmount) * 100 : 0;
  const remaining = budget ? budget.limitAmount - spent : 0;

  const startBudgetEdit = () => {
    setBudgetInput(budget ? String(budget.limitAmount) : "");
    setBudgetEditing(true);
  };

  const saveBudget = async () => {
    const amount = parseFloat(budgetInput);
    if (!isNaN(amount) && amount > 0) {
      setBudgetSaving(true);
      try { onSetBudget(amount); } finally { setBudgetSaving(false); }
    }
    setBudgetEditing(false);
    setBudgetInput("");
  };

  return (
    <Card sx={{ height: "100%" }}>
      <CardContent>
        {/* Header */}
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1.5 }}>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            {cat.group && (
              <Typography variant="overline" color="text.secondary" sx={{ display: "block", lineHeight: 1.4 }}>
                {cat.group}
              </Typography>
            )}
            <Typography variant="h6" sx={{ fontWeight: 600 }} noWrap>
              {cat.group ? cat.name.replace(`${cat.group} - `, "") : cat.name}
            </Typography>
          </Box>
          <Box sx={{ display: "flex", flexShrink: 0, ml: 1 }}>
            <Tooltip title="Edit category">
              <IconButton size="small" onClick={onEdit} sx={{ color: "text.secondary" }}>
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Delete category">
              <IconButton size="small" color="error" onClick={onDelete}>
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* Budget section */}
        {budgetEditing ? (
          <Box sx={{ display: "flex", gap: 1, alignItems: "center", mt: 1 }}>
            <TextField
              size="small"
              type="number"
              value={budgetInput}
              onChange={(e) => setBudgetInput(e.target.value)}
              autoFocus
              fullWidth
              label="Monthly limit"
              slotProps={{
                input: { startAdornment: <InputAdornment position="start">$</InputAdornment> },
                htmlInput: { min: 0 },
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") void saveBudget();
                if (e.key === "Escape") { setBudgetEditing(false); setBudgetInput(""); }
              }}
            />
            <IconButton size="small" color="primary" onClick={() => void saveBudget()} disabled={budgetSaving}>
              {budgetSaving ? <CircularProgress size={16} /> : <CheckIcon fontSize="small" />}
            </IconButton>
            <IconButton size="small" onClick={() => { setBudgetEditing(false); setBudgetInput(""); }}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
        ) : budget ? (
          <>
            <BudgetProgressBar spent={spent} limit={budget.limitAmount} currency={budget.currency} />
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mt: 1 }}>
              <Typography variant="caption" color="text.secondary">
                Limit: ${budget.limitAmount.toFixed(2)}/mo
              </Typography>
              <Typography
                variant="caption"
                sx={{ fontWeight: 600 }}
                color={percent >= 90 ? "error.main" : percent >= 70 ? "warning.main" : "text.secondary"}
              >
                ${remaining.toFixed(2)} left
              </Typography>
            </Box>
            <Box sx={{ display: "flex", gap: 1, mt: 1.5, alignItems: "center" }}>
              <Button size="small" variant="outlined" onClick={startBudgetEdit} sx={{ fontSize: "0.75rem" }}>
                Edit limit
              </Button>
              <Button
                size="small"
                variant="text"
                color="error"
                onClick={onClearBudget}
                sx={{ fontSize: "0.75rem" }}
              >
                Remove
              </Button>
              <Tooltip title={budget.carryForward ? "Repeats monthly — click to stop" : "Click to repeat every month"}>
                <IconButton size="small" onClick={onToggleCarryForward} sx={{ ml: "auto", color: budget.carryForward ? "primary.main" : "text.disabled" }}>
                  <RepeatIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          </>
        ) : (
          <Box
            sx={{
              mt: 1,
              py: 2,
              border: "1px dashed",
              borderColor: "divider",
              borderRadius: 1,
              textAlign: "center",
              cursor: "pointer",
              "&:hover": { borderColor: "primary.main", bgcolor: "action.hover" },
            }}
            onClick={startBudgetEdit}
          >
            <Typography variant="body2" color="text.disabled">
              + Set monthly budget
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
