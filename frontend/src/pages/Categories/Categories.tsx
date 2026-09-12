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
import { financeApi, FinanceCategory, FinanceCategoryGroup } from "@/api/finance.api";

type CategoryType = "expense" | "income";

interface GroupDraft {
  name: string;
  type: CategoryType;
  sortOrder: string;
}

interface CategoryDraft {
  name: string;
  groupId: string;
  type: CategoryType;
  sortOrder: string;
}

const blankGroupDraft: GroupDraft = {
  name: "",
  type: "expense",
  sortOrder: "0",
};

const blankCategoryDraft: CategoryDraft = {
  name: "",
  groupId: "",
  type: "expense",
  sortOrder: "0",
};

function groupValue(row: FinanceCategoryGroup, field: keyof GroupDraft): string {
  if (field === "sortOrder") return String(row.sortOrder ?? 0);
  return row[field];
}

function categoryValue(row: FinanceCategory, field: keyof CategoryDraft): string {
  if (field === "groupId") return row.groupId ?? "";
  if (field === "sortOrder") return String(row.sortOrder ?? 0);
  return row[field];
}

function CategoryStatSkeleton({ label }: { label: string }) {
  return (
    <Paper variant="outlined" sx={{ p: 1.75, borderRadius: 1, borderColor: "rgba(255,255,255,0.08)", bgcolor: "rgba(32,35,45,0.92)" }}>
      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800 }}>{label}</Typography>
      <Skeleton width="36%" height={40} sx={{ mt: 0.75 }} />
    </Paper>
  );
}

function MatrixSkeleton({ title }: { title: string }) {
  return (
    <Paper
      variant="outlined"
      sx={{
        overflow: "hidden",
        borderRadius: 1,
        borderColor: "rgba(255,255,255,0.08)",
        bgcolor: "rgba(32,35,45,0.94)",
      }}
    >
      <Box sx={{ px: 1.5, py: 1.25, borderBottom: "1px solid", borderColor: "rgba(255,255,255,0.08)", bgcolor: "rgba(15,17,23,0.36)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Typography variant="h5" sx={{ fontWeight: 900 }}>{title}</Typography>
        <Skeleton width={70} height={18} />
      </Box>
      <Box sx={{ p: 1.5, display: "grid", gap: 1 }}>
        {[0, 1, 2, 3, 4, 5].map((row) => (
          <Box key={row} sx={{ display: "grid", gridTemplateColumns: "1fr 160px 110px 48px", gap: 1, alignItems: "center" }}>
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
  const [groupDraft, setGroupDraft] = useState<GroupDraft>(blankGroupDraft);
  const [categoryDraft, setCategoryDraft] = useState<CategoryDraft>(blankCategoryDraft);
  const [groupEditing, setGroupEditing] = useState<Record<string, Partial<GroupDraft>>>({});
  const [categoryEditing, setCategoryEditing] = useState<Record<string, Partial<CategoryDraft>>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  const groupsQuery = useQuery({
    queryKey: ["finance", "category-groups"],
    queryFn: () => financeApi.categoryGroups(),
  });

  const categoriesQuery = useQuery({
    queryKey: ["finance", "categories"],
    queryFn: () => financeApi.categories(),
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["finance"] });
  };

  const createGroupMutation = useMutation({
    mutationFn: financeApi.createCategoryGroup,
    onSuccess: invalidate,
  });

  const updateGroupMutation = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<GroupDraft> }) =>
      financeApi.updateCategoryGroup(id, {
        ...patch,
        sortOrder: patch.sortOrder === undefined ? undefined : Number(patch.sortOrder),
      }),
    onSuccess: invalidate,
  });

  const deleteGroupMutation = useMutation({
    mutationFn: financeApi.deleteCategoryGroup,
    onSuccess: invalidate,
  });

  const createCategoryMutation = useMutation({
    mutationFn: financeApi.createCategory,
    onSuccess: invalidate,
  });

  const updateCategoryMutation = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<CategoryDraft> }) =>
      financeApi.updateCategory(id, {
        ...patch,
        groupId: patch.groupId === "" ? null : patch.groupId,
        sortOrder: patch.sortOrder === undefined ? undefined : Number(patch.sortOrder),
      }),
    onSuccess: invalidate,
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: financeApi.deleteCategory,
    onSuccess: invalidate,
  });

  const groups = useMemo(
    () => [...(groupsQuery.data ?? [])].sort((a, b) => {
      if (a.type !== b.type) return a.type.localeCompare(b.type);
      if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
      return a.name.localeCompare(b.name);
    }),
    [groupsQuery.data],
  );

  const categories = useMemo(
    () => [...(categoriesQuery.data ?? [])].sort((a, b) => {
      if (a.type !== b.type) return a.type.localeCompare(b.type);
      const group = (a.groupName ?? "").localeCompare(b.groupName ?? "");
      if (group !== 0) return group;
      if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
      return a.name.localeCompare(b.name);
    }),
    [categoriesQuery.data],
  );

  const groupsForType = (type: CategoryType) => groups.filter((group) => group.type === type);

  const setGroupCell = (id: string, field: keyof GroupDraft, value: string) => {
    setGroupEditing((current) => ({ ...current, [id]: { ...current[id], [field]: value } }));
  };

  const setCategoryCell = (id: string, field: keyof CategoryDraft, value: string) => {
    setCategoryEditing((current) => ({ ...current, [id]: { ...current[id], [field]: value } }));
  };

  const getGroupCell = (row: FinanceCategoryGroup, field: keyof GroupDraft): string => {
    return groupEditing[row.id]?.[field] ?? groupValue(row, field);
  };

  const getCategoryCell = (row: FinanceCategory, field: keyof CategoryDraft): string => {
    return categoryEditing[row.id]?.[field] ?? categoryValue(row, field);
  };

  const commitGroupCell = async (row: FinanceCategoryGroup, field: keyof GroupDraft) => {
    const next = groupEditing[row.id]?.[field];
    if (next === undefined) return;
    const current = groupValue(row, field);

    setGroupEditing((state) => {
      const nextRow = { ...state[row.id] };
      delete nextRow[field];
      return { ...state, [row.id]: nextRow };
    });

    if (next === current || !String(next).trim()) return;
    setSavingId(row.id);
    try {
      await updateGroupMutation.mutateAsync({ id: row.id, patch: { [field]: next } });
    } finally {
      setSavingId(null);
    }
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

    if (next === current || (field !== "groupId" && !String(next).trim())) return;
    setSavingId(row.id);
    try {
      await updateCategoryMutation.mutateAsync({ id: row.id, patch: { [field]: next } });
    } finally {
      setSavingId(null);
    }
  };

  const createGroup = async () => {
    if (!groupDraft.name.trim()) return;
    await createGroupMutation.mutateAsync({
      name: groupDraft.name.trim(),
      type: groupDraft.type,
      sortOrder: Number(groupDraft.sortOrder) || 0,
    });
    setGroupDraft({ ...blankGroupDraft, type: groupDraft.type });
  };

  const createCategory = async () => {
    if (!categoryDraft.name.trim()) return;
    await createCategoryMutation.mutateAsync({
      name: categoryDraft.name.trim(),
      groupId: categoryDraft.groupId || null,
      type: categoryDraft.type,
      sortOrder: Number(categoryDraft.sortOrder) || 0,
    });
    setCategoryDraft({ ...blankCategoryDraft, type: categoryDraft.type, groupId: categoryDraft.groupId });
  };

  const expenseCount = categories.filter((row) => row.type === "expense").length;
  const incomeCount = categories.filter((row) => row.type === "income").length;
  const groupCount = groups.length;
  const loading = groupsQuery.isLoading || categoriesQuery.isLoading;

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
          backgroundImage: "linear-gradient(135deg, rgba(255,107,44,0.16), rgba(88,101,242,0.12) 46%, rgba(255,255,255,0.03))",
        }}
      >
        <Typography variant="overline" color="primary.main" sx={{ fontWeight: 900 }}>Configuration</Typography>
        <Typography variant="h1" sx={{ fontWeight: 900 }}>Categories</Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mt: 1, maxWidth: 660 }}>
          Manage category groups and the categories inside them. Ledger entry still uses one category picker.
        </Typography>
      </Paper>

      <Grid container spacing={2} sx={{ mb: 2 }}>
        {[
          ["Groups", groupCount],
          ["Expense categories", expenseCount],
          ["Income categories", incomeCount],
        ].map(([label, value]) => (
          <Grid key={label} size={{ xs: 12, md: 4 }}>
            {loading ? (
              <CategoryStatSkeleton label={String(label)} />
            ) : (
              <Paper variant="outlined" sx={{ p: 1.75, borderRadius: 1, borderColor: "rgba(255,255,255,0.08)", bgcolor: "rgba(32,35,45,0.92)", boxShadow: "0 18px 40px rgba(0,0,0,0.24)" }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800 }}>{label}</Typography>
                <Typography variant="h4" sx={{ mt: 0.75, fontWeight: 900 }}>{value}</Typography>
              </Paper>
            )}
          </Grid>
        ))}
      </Grid>

      {(groupsQuery.isError || categoriesQuery.isError) && (
        <Alert severity="error" sx={{ mb: 2 }}>Failed to load categories</Alert>
      )}

      <Grid container spacing={2} sx={{ alignItems: "flex-start" }}>
        <Grid size={{ xs: 12, lg: 5 }}>
          {groupsQuery.isLoading ? (
            <MatrixSkeleton title="Category groups" />
          ) : (
            <Paper variant="outlined" sx={{ overflow: "hidden", borderRadius: 1, borderColor: "rgba(255,255,255,0.08)", bgcolor: "rgba(32,35,45,0.94)", boxShadow: "0 20px 52px rgba(0,0,0,0.28)" }}>
              <Box sx={{ px: 1.5, py: 1.25, borderBottom: "1px solid", borderColor: "rgba(255,255,255,0.08)", bgcolor: "rgba(15,17,23,0.36)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <Typography variant="h5" sx={{ fontWeight: 900 }}>Category groups</Typography>
                <Typography variant="caption" color="text.secondary">{groups.length} total</Typography>
              </Box>
              <TableContainer sx={{ maxHeight: "calc(100vh - 330px)" }}>
                <Table stickyHeader size="small" sx={{ tableLayout: "fixed", minWidth: 520 }}>
                  <TableHead>
                    <TableRow>
                      <TableCell>Group</TableCell>
                      <TableCell sx={{ width: 130 }}>Type</TableCell>
                      <TableCell align="right" sx={{ width: 90 }}>Sort</TableCell>
                      <TableCell sx={{ width: 48 }} />
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <TableRow sx={{ bgcolor: "action.hover" }}>
                      <TableCell>
                        <TextField size="small" variant="standard" fullWidth placeholder="Add group" value={groupDraft.name} onChange={(event) => setGroupDraft((value) => ({ ...value, name: event.target.value }))} />
                      </TableCell>
                      <TableCell>
                        <Select size="small" variant="standard" fullWidth value={groupDraft.type} onChange={(event) => setGroupDraft((value) => ({ ...value, type: event.target.value as CategoryType }))}>
                          <MenuItem value="expense">Expense</MenuItem>
                          <MenuItem value="income">Income</MenuItem>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <TextField type="number" size="small" variant="standard" fullWidth value={groupDraft.sortOrder} slotProps={{ htmlInput: { style: { textAlign: "right" } } }} onChange={(event) => setGroupDraft((value) => ({ ...value, sortOrder: event.target.value }))} />
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title="Add group">
                          <IconButton size="small" color="primary" onClick={() => void createGroup()}>
                            <AddIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>

                    {groups.map((row) => (
                      <TableRow key={row.id} hover sx={{ opacity: savingId === row.id ? 0.55 : 1 }}>
                        <TableCell>
                          <TextField size="small" variant="standard" fullWidth value={getGroupCell(row, "name")} onChange={(event) => setGroupCell(row.id, "name", event.target.value)} onBlur={() => void commitGroupCell(row, "name")} />
                        </TableCell>
                        <TableCell>
                          <Select size="small" variant="standard" fullWidth value={getGroupCell(row, "type")} onChange={(event) => void updateGroupMutation.mutateAsync({ id: row.id, patch: { type: event.target.value as CategoryType } })}>
                            <MenuItem value="expense">Expense</MenuItem>
                            <MenuItem value="income">Income</MenuItem>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <TextField type="number" size="small" variant="standard" fullWidth value={getGroupCell(row, "sortOrder")} slotProps={{ htmlInput: { style: { textAlign: "right" } } }} onChange={(event) => setGroupCell(row.id, "sortOrder", event.target.value)} onBlur={() => void commitGroupCell(row, "sortOrder")} />
                        </TableCell>
                        <TableCell align="center">
                          <Tooltip title="Delete group">
                            <IconButton size="small" onClick={() => void deleteGroupMutation.mutateAsync(row.id)}>
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
        </Grid>

        <Grid size={{ xs: 12, lg: 7 }}>
          {loading ? (
            <MatrixSkeleton title="Categories" />
          ) : (
            <Paper variant="outlined" sx={{ overflow: "hidden", borderRadius: 1, borderColor: "rgba(255,255,255,0.08)", bgcolor: "rgba(32,35,45,0.94)", boxShadow: "0 20px 52px rgba(0,0,0,0.28)" }}>
              <Box sx={{ px: 1.5, py: 1.25, borderBottom: "1px solid", borderColor: "rgba(255,255,255,0.08)", bgcolor: "rgba(15,17,23,0.36)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <Typography variant="h5" sx={{ fontWeight: 900 }}>Categories</Typography>
                <Typography variant="caption" color="text.secondary">{categories.length} total</Typography>
              </Box>
              <TableContainer sx={{ maxHeight: "calc(100vh - 330px)" }}>
                <Table stickyHeader size="small" sx={{ tableLayout: "fixed", minWidth: 720 }}>
                  <TableHead>
                    <TableRow>
                      <TableCell>Category</TableCell>
                      <TableCell sx={{ width: 220 }}>Group</TableCell>
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
                        <Select size="small" variant="standard" fullWidth displayEmpty value={categoryDraft.groupId} onChange={(event) => setCategoryDraft((value) => ({ ...value, groupId: event.target.value }))}>
                          <MenuItem value="">No group</MenuItem>
                          {groupsForType(categoryDraft.type).map((group) => (
                            <MenuItem key={group.id} value={group.id}>{group.name}</MenuItem>
                          ))}
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Select size="small" variant="standard" fullWidth value={categoryDraft.type} onChange={(event) => setCategoryDraft((value) => ({ ...value, type: event.target.value as CategoryType, groupId: "" }))}>
                          <MenuItem value="expense">Expense</MenuItem>
                          <MenuItem value="income">Income</MenuItem>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <TextField type="number" size="small" variant="standard" fullWidth value={categoryDraft.sortOrder} slotProps={{ htmlInput: { style: { textAlign: "right" } } }} onChange={(event) => setCategoryDraft((value) => ({ ...value, sortOrder: event.target.value }))} />
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title="Add category">
                          <IconButton size="small" color="primary" onClick={() => void createCategory()}>
                            <AddIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>

                    {categories.map((row) => (
                      <TableRow key={row.id} hover sx={{ opacity: savingId === row.id ? 0.55 : 1 }}>
                        <TableCell>
                          <TextField size="small" variant="standard" fullWidth value={getCategoryCell(row, "name")} onChange={(event) => setCategoryCell(row.id, "name", event.target.value)} onBlur={() => void commitCategoryCell(row, "name")} />
                        </TableCell>
                        <TableCell>
                          <Select size="small" variant="standard" fullWidth displayEmpty value={getCategoryCell(row, "groupId")} onChange={(event) => void updateCategoryMutation.mutateAsync({ id: row.id, patch: { groupId: event.target.value } })}>
                            <MenuItem value="">No group</MenuItem>
                            {groupsForType(row.type).map((group) => (
                              <MenuItem key={group.id} value={group.id}>{group.name}</MenuItem>
                            ))}
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Select size="small" variant="standard" fullWidth value={getCategoryCell(row, "type")} onChange={(event) => void updateCategoryMutation.mutateAsync({ id: row.id, patch: { type: event.target.value as CategoryType, groupId: "" } })}>
                            <MenuItem value="expense">Expense</MenuItem>
                            <MenuItem value="income">Income</MenuItem>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <TextField type="number" size="small" variant="standard" fullWidth value={getCategoryCell(row, "sortOrder")} slotProps={{ htmlInput: { style: { textAlign: "right" } } }} onChange={(event) => setCategoryCell(row.id, "sortOrder", event.target.value)} onBlur={() => void commitCategoryCell(row, "sortOrder")} />
                        </TableCell>
                        <TableCell align="center">
                          <Tooltip title="Delete category">
                            <IconButton size="small" onClick={() => void deleteCategoryMutation.mutateAsync(row.id)}>
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
        </Grid>
      </Grid>
    </Box>
  );
}
