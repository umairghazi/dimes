import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Alert,
  Box,
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

type CategoryType = "expense" | "income";

interface CategoryDraft {
  name: string;
  mainCategory: string;
  type: CategoryType;
  sortOrder: string;
}

const blankDraft: CategoryDraft = {
  name: "",
  mainCategory: "",
  type: "expense",
  sortOrder: "0",
};

function displayValue(row: FinanceCategory, field: keyof CategoryDraft): string {
  if (field === "mainCategory") return row.mainCategory ?? "";
  if (field === "sortOrder") return String(row.sortOrder ?? 0);
  return row[field];
}

export function Categories() {
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState<CategoryDraft>(blankDraft);
  const [editing, setEditing] = useState<Record<string, Partial<CategoryDraft>>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  const categoriesQuery = useQuery({
    queryKey: ["finance", "categories"],
    queryFn: () => financeApi.categories(),
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["finance"] });
  };

  const createMutation = useMutation({
    mutationFn: financeApi.createCategory,
    onSuccess: invalidate,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<CategoryDraft> }) =>
      financeApi.updateCategory(id, {
        ...patch,
        mainCategory: patch.mainCategory === "" ? null : patch.mainCategory,
        sortOrder: patch.sortOrder === undefined ? undefined : Number(patch.sortOrder),
      }),
    onSuccess: invalidate,
  });

  const deleteMutation = useMutation({
    mutationFn: financeApi.deleteCategory,
    onSuccess: invalidate,
  });

  const rows = useMemo(
    () => [...(categoriesQuery.data ?? [])].sort((a, b) => {
      if (a.type !== b.type) return a.type.localeCompare(b.type);
      const main = (a.mainCategory ?? "").localeCompare(b.mainCategory ?? "");
      if (main !== 0) return main;
      if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
      return a.name.localeCompare(b.name);
    }),
    [categoriesQuery.data],
  );

  const setCell = (id: string, field: keyof CategoryDraft, value: string) => {
    setEditing((current) => ({ ...current, [id]: { ...current[id], [field]: value } }));
  };

  const getCell = (row: FinanceCategory, field: keyof CategoryDraft): string => {
    return editing[row.id]?.[field] ?? displayValue(row, field);
  };

  const commitCell = async (row: FinanceCategory, field: keyof CategoryDraft) => {
    const next = editing[row.id]?.[field];
    if (next === undefined) return;
    const current = displayValue(row, field);

    setEditing((state) => {
      const nextRow = { ...state[row.id] };
      delete nextRow[field];
      return { ...state, [row.id]: nextRow };
    });

    if (next === current || (field !== "mainCategory" && !String(next).trim())) return;
    setSavingId(row.id);
    try {
      await updateMutation.mutateAsync({ id: row.id, patch: { [field]: next } });
    } finally {
      setSavingId(null);
    }
  };

  const createCategory = async () => {
    if (!draft.name.trim()) return;
    await createMutation.mutateAsync({
      name: draft.name.trim(),
      mainCategory: draft.mainCategory.trim() || null,
      type: draft.type,
      sortOrder: Number(draft.sortOrder) || 0,
    });
    setDraft({ ...blankDraft, type: draft.type });
  };

  const addOnEnter = async (event: React.KeyboardEvent<HTMLElement>) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    await createCategory();
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1220, mx: "auto" }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="overline" color="primary.main" sx={{ fontWeight: 850 }}>Configuration</Typography>
        <Typography variant="h2" sx={{ fontWeight: 850 }}>Categories</Typography>
      </Box>

      {categoriesQuery.isError && <Alert severity="error" sx={{ mb: 2 }}>Failed to load categories</Alert>}

      {categoriesQuery.isLoading ? (
        <Skeleton variant="rectangular" height={540} sx={{ borderRadius: 1 }} />
      ) : (
        <Paper
          variant="outlined"
          sx={{
            overflow: "hidden",
            borderRadius: 1,
            bgcolor: (theme) => theme.palette.mode === "dark" ? "rgba(23,26,32,0.88)" : "rgba(255,255,255,0.84)",
            backdropFilter: "blur(18px)",
            WebkitBackdropFilter: "blur(18px)",
          }}
        >
          <TableContainer sx={{ maxHeight: "calc(100vh - 160px)" }}>
            <Table
              stickyHeader
              size="small"
              sx={{
                tableLayout: "fixed",
                minWidth: 780,
                "& .MuiTableCell-root": {
                  px: 1,
                  py: 0.55,
                  height: 38,
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
                  <TableCell sx={{ width: 260 }}>Category</TableCell>
                  <TableCell sx={{ width: 220 }}>Main Category</TableCell>
                  <TableCell sx={{ width: 140 }}>Type</TableCell>
                  <TableCell align="right" sx={{ width: 110 }}>Sort</TableCell>
                  <TableCell sx={{ width: 48 }} />
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow sx={{ bgcolor: "action.hover" }}>
                  <TableCell>
                    <TextField
                      size="small"
                      variant="standard"
                      fullWidth
                      placeholder="Add category"
                      value={draft.name}
                      onChange={(event) => setDraft((value) => ({ ...value, name: event.target.value }))}
                      onKeyDown={addOnEnter}
                    />
                  </TableCell>
                  <TableCell>
                    <TextField
                      size="small"
                      variant="standard"
                      fullWidth
                      placeholder="Main category"
                      value={draft.mainCategory}
                      onChange={(event) => setDraft((value) => ({ ...value, mainCategory: event.target.value }))}
                      onKeyDown={addOnEnter}
                    />
                  </TableCell>
                  <TableCell>
                    <Select
                      size="small"
                      variant="standard"
                      fullWidth
                      value={draft.type}
                      onChange={(event) => setDraft((value) => ({ ...value, type: event.target.value as CategoryType }))}
                    >
                      <MenuItem value="expense">Expense</MenuItem>
                      <MenuItem value="income">Income</MenuItem>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <TextField
                      type="number"
                      size="small"
                      variant="standard"
                      fullWidth
                      value={draft.sortOrder}
                      slotProps={{ htmlInput: { style: { textAlign: "right" } } }}
                      onChange={(event) => setDraft((value) => ({ ...value, sortOrder: event.target.value }))}
                      onKeyDown={addOnEnter}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title="Add category">
                      <IconButton size="small" color="primary" onClick={() => void createCategory()}>
                        <AddIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>

                {rows.map((row) => (
                  <TableRow key={row.id} hover sx={{ opacity: savingId === row.id ? 0.55 : 1 }}>
                    <TableCell>
                      <TextField
                        size="small"
                        variant="standard"
                        fullWidth
                        value={getCell(row, "name")}
                        onChange={(event) => setCell(row.id, "name", event.target.value)}
                        onBlur={() => void commitCell(row, "name")}
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        size="small"
                        variant="standard"
                        fullWidth
                        value={getCell(row, "mainCategory")}
                        onChange={(event) => setCell(row.id, "mainCategory", event.target.value)}
                        onBlur={() => void commitCell(row, "mainCategory")}
                      />
                    </TableCell>
                    <TableCell>
                      <Select
                        size="small"
                        variant="standard"
                        fullWidth
                        value={getCell(row, "type")}
                        onChange={(event) => {
                          const value = event.target.value as CategoryType;
                          setCell(row.id, "type", value);
                          void updateMutation.mutateAsync({ id: row.id, patch: { type: value } });
                        }}
                      >
                        <MenuItem value="expense">Expense</MenuItem>
                        <MenuItem value="income">Income</MenuItem>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <TextField
                        type="number"
                        size="small"
                        variant="standard"
                        fullWidth
                        value={getCell(row, "sortOrder")}
                        slotProps={{ htmlInput: { style: { textAlign: "right" } } }}
                        onChange={(event) => setCell(row.id, "sortOrder", event.target.value)}
                        onBlur={() => void commitCell(row, "sortOrder")}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="Delete category">
                        <IconButton size="small" onClick={() => void deleteMutation.mutateAsync(row.id)}>
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
