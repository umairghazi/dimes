import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Alert,
  Box,
  Grid,
  IconButton,
  MenuItem,
  Paper,
  Select,
  Skeleton,
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
import { financeApi, FinanceCategory } from "@/api/finance.api";
import { PageHero } from "@/components/finance/PageHero";
import { MetricCard, MetricCardSkeleton } from "@/components/finance/MetricCard";
import { categoryLabel } from "@/components/finance/categoryLabels";

type CategoryType = "expense" | "income";

interface CategoryDraft {
  name: string;
  parentId: string;
  type: CategoryType;
  sortOrder: string;
}

const blankCategoryDraft: CategoryDraft = {
  name: "",
  parentId: "",
  type: "expense",
  sortOrder: "0",
};

function categoryValue(row: FinanceCategory, field: keyof CategoryDraft): string {
  if (field === "parentId") return row.parentId ?? "";
  if (field === "sortOrder") return String(row.sortOrder ?? 0);
  return row[field];
}

function MatrixSkeleton() {
  return (
    <Paper variant="outlined" sx={{ overflow: "hidden", borderRadius: 1, borderColor: "rgba(255,255,255,0.08)", bgcolor: "rgba(32,35,45,0.94)" }}>
      <Box sx={{ px: 1.5, py: 1.25, borderBottom: "1px solid", borderColor: "rgba(255,255,255,0.08)", bgcolor: "rgba(15,17,23,0.36)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Typography variant="h5" sx={{ fontWeight: 900 }}>Category tree</Typography>
        <Skeleton width={70} height={18} />
      </Box>
      <Box sx={{ p: 1.5, display: "grid", gap: 1 }}>
        {[0, 1, 2, 3, 4, 5].map((row) => (
          <Box key={row} sx={{ display: "grid", gridTemplateColumns: "1fr 240px 120px 90px 48px", gap: 1, alignItems: "center" }}>
            <Skeleton height={24} />
            <Skeleton height={24} />
            <Skeleton height={24} />
            <Skeleton height={24} />
            <Skeleton height={24} />
          </Box>
        ))}
      </Box>
    </Paper>
  );
}

export function Categories() {
  const queryClient = useQueryClient();
  const [categoryDraft, setCategoryDraft] = useState<CategoryDraft>(blankCategoryDraft);
  const [categoryEditing, setCategoryEditing] = useState<Record<string, Partial<CategoryDraft>>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  const categoriesQuery = useQuery({
    queryKey: ["finance", "categories"],
    queryFn: () => financeApi.categories(),
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["finance"] });
  };

  const createCategoryMutation = useMutation({
    mutationFn: financeApi.createCategory,
    onSuccess: invalidate,
  });

  const updateCategoryMutation = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<CategoryDraft> }) =>
      financeApi.updateCategory(id, {
        ...patch,
        parentId: patch.parentId === "" ? null : patch.parentId,
        sortOrder: patch.sortOrder === undefined ? undefined : Number(patch.sortOrder),
      }),
    onSuccess: invalidate,
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: financeApi.deleteCategory,
    onSuccess: invalidate,
  });

  const categories = useMemo(
    () => [...(categoriesQuery.data ?? [])].sort((a, b) => {
      if (a.type !== b.type) return a.type.localeCompare(b.type);
      if (a.path.length !== b.path.length) return a.path.length - b.path.length;
      const path = categoryLabel(a).localeCompare(categoryLabel(b));
      if (path !== 0) return path;
      if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
      return a.name.localeCompare(b.name);
    }),
    [categoriesQuery.data],
  );

  const parentOptions = (type: CategoryType, currentId?: string) => {
    const blocked = new Set([
      currentId,
      ...categories
        .filter((category) => currentId && category.path.some((part) => part.id === currentId))
        .map((category) => category.id),
    ]);
    return categories.filter((category) => category.type === type && !blocked.has(category.id));
  };

  const setCategoryCell = (id: string, field: keyof CategoryDraft, value: string) => {
    setCategoryEditing((current) => ({ ...current, [id]: { ...current[id], [field]: value } }));
  };

  const getCategoryCell = (row: FinanceCategory, field: keyof CategoryDraft): string => {
    return categoryEditing[row.id]?.[field] ?? categoryValue(row, field);
  };

  const commitCategoryCell = async (row: FinanceCategory, field: keyof CategoryDraft) => {
    const next = categoryEditing[row.id]?.[field];
    if (next === undefined) return;
    const current = categoryValue(row, field);

    setCategoryEditing((state) => {
      const nextRow = { ...state[row.id] };
      delete nextRow[field];
      return { ...state, [row.id]: nextRow };
    });

    if (next === current || (field !== "parentId" && !String(next).trim())) return;
    setSavingId(row.id);
    try {
      await updateCategoryMutation.mutateAsync({ id: row.id, patch: { [field]: next } });
    } finally {
      setSavingId(null);
    }
  };

  const createCategory = async () => {
    if (!categoryDraft.name.trim()) return;
    await createCategoryMutation.mutateAsync({
      name: categoryDraft.name.trim(),
      parentId: categoryDraft.parentId || null,
      type: categoryDraft.type,
      sortOrder: Number(categoryDraft.sortOrder) || 0,
    });
    setCategoryDraft({ ...blankCategoryDraft, type: categoryDraft.type, parentId: categoryDraft.parentId });
  };

  const expenseCount = categories.filter((row) => row.type === "expense").length;
  const incomeCount = categories.filter((row) => row.type === "income").length;
  const rootCount = categories.filter((row) => !row.parentId).length;
  const loading = categoriesQuery.isLoading;

  return (
    <Box>
      <PageHero
        eyebrow="Configuration"
        title="Categories"
        description="Manage categories as a tree. Transactions point to the most specific category, and reports roll up to every parent."
        variant="warm"
      />

      <Grid container spacing={2} sx={{ mb: 2 }}>
        {[
          ["Root categories", rootCount],
          ["Expense categories", expenseCount],
          ["Income categories", incomeCount],
        ].map(([label, value]) => (
          <Grid key={label} size={{ xs: 12, md: 4 }}>
            {loading ? (
              <MetricCardSkeleton label={String(label)} />
            ) : (
              <MetricCard label={String(label)} value={String(value)} />
            )}
          </Grid>
        ))}
      </Grid>

      {categoriesQuery.isError && <Alert severity="error" sx={{ mb: 2 }}>Failed to load categories</Alert>}

      {loading ? (
        <MatrixSkeleton />
      ) : (
        <Paper variant="outlined" sx={{ overflow: "hidden", borderRadius: 1, borderColor: "rgba(255,255,255,0.08)", bgcolor: "rgba(32,35,45,0.94)", boxShadow: "0 20px 52px rgba(0,0,0,0.28)" }}>
          <Box sx={{ px: 1.5, py: 1.25, borderBottom: "1px solid", borderColor: "rgba(255,255,255,0.08)", bgcolor: "rgba(15,17,23,0.36)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <Typography variant="h5" sx={{ fontWeight: 900 }}>Category tree</Typography>
            <Typography variant="caption" color="text.secondary">{categories.length} total</Typography>
          </Box>
          <TableContainer sx={{ maxHeight: "calc(100vh - 330px)" }}>
            <Table stickyHeader size="small" sx={{ tableLayout: "fixed", minWidth: 860 }}>
              <TableHead>
                <TableRow>
                  <TableCell>Category</TableCell>
                  <TableCell sx={{ width: 280 }}>Parent</TableCell>
                  <TableCell sx={{ width: 130 }}>Type</TableCell>
                  <TableCell align="right" sx={{ width: 90 }}>Sort</TableCell>
                  <TableCell sx={{ width: 48 }} />
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow sx={{ bgcolor: "action.hover" }}>
                  <TableCell>
                    <TextField size="small" variant="standard" fullWidth placeholder="Add category" value={categoryDraft.name} onChange={(event) => setCategoryDraft((value) => ({ ...value, name: event.target.value }))} />
                  </TableCell>
                  <TableCell>
                    <Select size="small" variant="standard" fullWidth displayEmpty value={categoryDraft.parentId} onChange={(event) => setCategoryDraft((value) => ({ ...value, parentId: event.target.value }))}>
                      <MenuItem value="">No parent</MenuItem>
                      {parentOptions(categoryDraft.type).map((category) => (
                        <MenuItem key={category.id} value={category.id}>{categoryLabel(category)}</MenuItem>
                      ))}
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Select size="small" variant="standard" fullWidth value={categoryDraft.type} onChange={(event) => setCategoryDraft((value) => ({ ...value, type: event.target.value as CategoryType, parentId: "" }))}>
                      <MenuItem value="expense">Expense</MenuItem>
                      <MenuItem value="income">Income</MenuItem>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <TextField type="number" size="small" variant="standard" fullWidth value={categoryDraft.sortOrder} slotProps={{ htmlInput: { style: { textAlign: "right" } } }} onChange={(event) => setCategoryDraft((value) => ({ ...value, sortOrder: event.target.value }))} />
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title="Add category">
                      <IconButton size="small" color="primary" loading={createCategoryMutation.isPending} onClick={() => void createCategory()}>
                        <AddIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>

                {categories.map((row) => (
                  <TableRow key={row.id} hover sx={{ opacity: savingId === row.id ? 0.55 : 1 }}>
                    <TableCell>
                      <TextField
                        size="small"
                        variant="standard"
                        fullWidth
                        value={getCategoryCell(row, "name")}
                        onChange={(event) => setCategoryCell(row.id, "name", event.target.value)}
                        onBlur={() => void commitCategoryCell(row, "name")}
                        sx={{ pl: Math.min(row.depth, 5) * 2 }}
                      />
                    </TableCell>
                    <TableCell>
                      <Select size="small" variant="standard" fullWidth displayEmpty value={getCategoryCell(row, "parentId")} onChange={(event) => void updateCategoryMutation.mutateAsync({ id: row.id, patch: { parentId: event.target.value } })}>
                        <MenuItem value="">No parent</MenuItem>
                        {parentOptions(row.type, row.id).map((category) => (
                          <MenuItem key={category.id} value={category.id}>{categoryLabel(category)}</MenuItem>
                        ))}
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Select size="small" variant="standard" fullWidth value={getCategoryCell(row, "type")} onChange={(event) => void updateCategoryMutation.mutateAsync({ id: row.id, patch: { type: event.target.value as CategoryType, parentId: "" } })}>
                        <MenuItem value="expense">Expense</MenuItem>
                        <MenuItem value="income">Income</MenuItem>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <TextField type="number" size="small" variant="standard" fullWidth value={getCategoryCell(row, "sortOrder")} slotProps={{ htmlInput: { style: { textAlign: "right" } } }} onChange={(event) => setCategoryCell(row.id, "sortOrder", event.target.value)} onBlur={() => void commitCategoryCell(row, "sortOrder")} />
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="Delete category">
                        <IconButton size="small" loading={savingId === row.id || (deleteCategoryMutation.isPending && deleteCategoryMutation.variables === row.id)} onClick={() => void deleteCategoryMutation.mutateAsync(row.id)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}
    </Box>
  );
}
