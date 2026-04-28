import { useEffect, useState } from "react";
import { Box, TextField, FormControl, InputLabel, Button, InputAdornment, ToggleButtonGroup, ToggleButton } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import { useFilterStore } from "@/store/filterStore";
import { CategorySelect } from "@/components/shared/CategorySelect";

export function FilterBar() {
  const { filters, setFilter, clearFilters } = useFilterStore();

  const [searchInput, setSearchInput] = useState(filters.search ?? "");

  useEffect(() => {
    const id = setTimeout(() => {
      setFilter("search", searchInput || undefined);
    }, 300);
    return () => clearTimeout(id);
  }, [searchInput]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!filters.search) setSearchInput("");
  }, [filters.search]);

  const handleClear = () => {
    setSearchInput("");
    clearFilters();
  };

  const typeValue = filters.type ?? "expense";

  return (
    <Box sx={{ display: "flex", gap: 1.5, mb: 2, flexWrap: "wrap", alignItems: "center" }}>
      <ToggleButtonGroup
        size="small"
        exclusive
        value={typeValue}
        onChange={(_, v) => { if (v) setFilter("type", v as "expense" | "income"); }}
      >
        <ToggleButton value="expense">Expenses</ToggleButton>
        <ToggleButton value="income">Income</ToggleButton>
      </ToggleButtonGroup>

      <TextField
        placeholder="Search description..."
        value={searchInput}
        onChange={(e) => setSearchInput(e.target.value)}
        size="small"
        sx={{ minWidth: 220 }}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" sx={{ color: "text.disabled" }} />
              </InputAdornment>
            ),
          },
        }}
      />

      <FormControl size="small" sx={{ minWidth: 180 }}>
        <InputLabel>Category</InputLabel>
        <CategorySelect
          label="Category"
          value={filters.categoryId ?? ""}
          onChange={(e) => setFilter("categoryId", (e.target.value as string) || undefined)}
          includeAll
          categoryType={typeValue}
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

      <Button size="small" variant="outlined" onClick={handleClear}>
        Clear
      </Button>
    </Box>
  );
}
