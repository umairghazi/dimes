import { useState } from "react";
import {
  Box,
  Chip,
  Select,
  MenuItem,
  ListSubheader,
  IconButton,
  CircularProgress,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import { useCategories } from "@/hooks/useCategories";
import { expensesApi } from "@/api/expenses.api";

interface CategoryEditCellProps {
  expenseId: string;
  category: string;       // display name (always present in API response)
  categoryId: string | null;
  onUpdated: () => void;
}

export function CategoryEditCell({ expenseId, category, categoryId, onUpdated }: CategoryEditCellProps) {
  const { tree } = useCategories();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Resolve current select value: prefer categoryId, fall back to finding by name
  const currentValue = categoryId ?? (
    tree.flatMap((g) => g.items).find((c) => c.name === category)?.id ?? ""
  );

  const handleChange = async (newCategoryId: string) => {
    if (newCategoryId === currentValue) { setEditing(false); return; }
    setSaving(true);
    try {
      await expensesApi.update(expenseId, { categoryId: newCategoryId });
      onUpdated();
    } finally {
      setSaving(false);
      setEditing(false);
    }
  };

  if (saving) {
    return <CircularProgress size={18} />;
  }

  if (editing) {
    return (
      <Select
        value={currentValue}
        onChange={(e) => void handleChange(e.target.value)}
        onClose={() => setEditing(false)}
        size="small"
        autoFocus
        open
        sx={{ minWidth: 160, fontSize: "0.8125rem" }}
      >
        {tree.map((group) =>
          group.group !== null
            ? [
                <ListSubheader key={`hdr-${group.group}`}>{group.group}</ListSubheader>,
                ...group.items.map((cat) => (
                  <MenuItem key={cat.id} value={cat.id} sx={{ pl: 3, fontSize: "0.8125rem" }}>
                    {cat.name.replace(`${group.group} - `, "")}
                  </MenuItem>
                )),
              ]
            : group.items.map((cat) => (
                <MenuItem key={cat.id} value={cat.id} sx={{ fontSize: "0.8125rem" }}>
                  {cat.name}
                </MenuItem>
              ))
        )}
      </Select>
    );
  }

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 0.5,
        "&:hover .edit-btn": { opacity: 1 },
      }}
    >
      <Chip label={category} size="small" variant="outlined" />
      <IconButton
        className="edit-btn"
        size="small"
        onClick={() => setEditing(true)}
        sx={{ opacity: 0, transition: "opacity 0.15s", p: 0.25 }}
      >
        <EditIcon sx={{ fontSize: 14 }} />
      </IconButton>
    </Box>
  );
}
