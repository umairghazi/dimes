import { Box, TextField, FormControl, InputLabel, Button } from "@mui/material";
import { useFilterStore } from "@/store/filterStore";
import { CategorySelect } from "@/components/shared/CategorySelect";

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
      <FormControl size="small" sx={{ minWidth: 180 }}>
        <InputLabel>Category</InputLabel>
        <CategorySelect
          label="Category"
          value={filters.category ?? ""}
          onChange={(e) => setFilter("category", (e.target.value as string) || undefined)}
          includeAll
        />
      </FormControl>

      <TextField
        label="From"
        type="date"
        value={filters.dateFrom ?? ""}
        onChange={(e) => setFilter("dateFrom", e.target.value || undefined)}
        size="small"
        slotProps={{ inputLabel: { shrink: true } }}
        sx={{ minWidth: 150 }}
      />

      <TextField
        label="To"
        type="date"
        value={filters.dateTo ?? ""}
        onChange={(e) => setFilter("dateTo", e.target.value || undefined)}
        size="small"
        slotProps={{ inputLabel: { shrink: true } }}
        sx={{ minWidth: 150 }}
      />

      <Button size="small" variant="outlined" onClick={clearFilters}>
        Clear
      </Button>
    </Box>
  );
}
