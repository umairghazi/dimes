import { Box, TextField, MenuItem, Button } from "@mui/material";
import { useFilterStore } from "@/store/filterStore";
import { EXPENSE_CATEGORIES } from "@/types/expense.types";

export function FilterBar() {
  const { filters, setFilter, clearFilters } = useFilterStore();

  return (
    <Box
      sx={{
        display: "flex",
        gap: 1.5,
        mb: 2,
        flexWrap: "wrap",
        alignItems: "center",
      }}
    >
      <TextField
        select
        label="Category"
        value={filters.category ?? ""}
        onChange={(e) => setFilter("category", e.target.value || undefined)}
        size="small"
        sx={{ minWidth: 160 }}
      >
        <MenuItem value="">All</MenuItem>
        {EXPENSE_CATEGORIES.map((c) => (
          <MenuItem key={c} value={c}>{c}</MenuItem>
        ))}
      </TextField>

      <TextField
        label="From"
        type="date"
        value={filters.dateFrom ?? ""}
        onChange={(e) => setFilter("dateFrom", e.target.value || undefined)}
        size="small"
        InputLabelProps={{ shrink: true }}
        sx={{ minWidth: 150 }}
      />

      <TextField
        label="To"
        type="date"
        value={filters.dateTo ?? ""}
        onChange={(e) => setFilter("dateTo", e.target.value || undefined)}
        size="small"
        InputLabelProps={{ shrink: true }}
        sx={{ minWidth: 150 }}
      />

      <Button size="small" variant="outlined" onClick={clearFilters}>
        Clear
      </Button>
    </Box>
  );
}
