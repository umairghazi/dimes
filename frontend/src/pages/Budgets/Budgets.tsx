import { useState } from "react";
import { Box, Typography, Button, Grid, Alert, Skeleton } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { useBudgets } from "@/hooks/useBudgets";
import { BudgetCard } from "@/components/budgets/BudgetCard";
import { BudgetForm } from "@/components/budgets/BudgetForm";
import { useAnalytics } from "@/hooks/useAnalytics";

export function Budgets() {
  const { budgets, loading, error, createBudget, updateBudget, deleteBudget } = useBudgets();
  const { summary } = useAnalytics();
  const [formOpen, setFormOpen] = useState(false);

  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const getSpent = (category: string) =>
    summary?.byCategory.find((c) => c.category === category)?.amount ?? 0;

  if (error) return <Alert severity="error" sx={{ m: 3 }}>{error}</Alert>;

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Typography variant="h4" fontWeight={700}>Budgets</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setFormOpen(true)}>
          New Budget
        </Button>
      </Box>

      <Grid container spacing={2}>
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <Grid item xs={12} sm={6} md={4} key={i}>
                <Skeleton variant="rectangular" height={160} sx={{ borderRadius: 2 }} />
              </Grid>
            ))
          : budgets.map((budget) => (
              <Grid item xs={12} sm={6} md={4} key={budget.id}>
                <BudgetCard
                  budget={budget}
                  spent={getSpent(budget.category)}
                  onDelete={() => void deleteBudget(budget.id)}
                  onUpdate={(dto) => void updateBudget(budget.id, dto)}
                />
              </Grid>
            ))}
      </Grid>

      <BudgetForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSave={(dto) => void createBudget({ ...dto, monthYear: currentMonth })}
      />
    </Box>
  );
}
