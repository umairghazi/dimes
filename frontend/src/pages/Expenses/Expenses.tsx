import { useState } from "react";
import { Box, Typography, Alert } from "@mui/material";
import { useExpenses } from "@/hooks/useExpenses";
import { useFilterStore } from "@/store/filterStore";
import { ExpenseTable } from "@/components/expenses/ExpenseTable";
import { ExpenseCardList } from "@/components/expenses/ExpenseCardList";
import { FilterBar } from "@/components/expenses/FilterBar";
import { QuickAddFAB } from "@/components/quickAdd/QuickAddFAB";
import { useBreakpoint } from "@/hooks/useBreakpoint";

export function Expenses() {
  const { isMobile } = useBreakpoint();
  const { filters } = useFilterStore();
  const [page, setPage] = useState(1);
  const { data, loading, error, refetch } = useExpenses(filters, page);

  if (error) return <Alert severity="error" sx={{ m: 3 }}>{error}</Alert>;

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Typography variant="h4" fontWeight={700} mb={3}>Expenses</Typography>

      <FilterBar />

      {isMobile ? (
        <ExpenseCardList
          expenses={data?.data ?? []}
          loading={loading}
          onUpdate={refetch}
        />
      ) : (
        <ExpenseTable
          expenses={data?.data ?? []}
          loading={loading}
          page={page}
          totalPages={data?.totalPages ?? 1}
          onPageChange={setPage}
          onUpdate={refetch}
        />
      )}

      <QuickAddFAB onSaved={refetch} />
    </Box>
  );
}
