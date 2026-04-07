import { Card, CardContent, Typography, Box, IconButton } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import { Budget, UpdateBudgetDto } from "@/types/budget.types";
import { BudgetProgressBar } from "@/components/charts/BudgetProgressBar";

interface BudgetCardProps {
  budget: Budget;
  spent: number;
  onDelete: () => void;
  onUpdate: (dto: UpdateBudgetDto) => void;
}

export function BudgetCard({ budget, spent, onDelete }: BudgetCardProps) {
  const percent = (spent / budget.limitAmount) * 100;

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1.5 }}>
          <Box>
            <Typography variant="overline" color="text.secondary">
              {budget.monthYear}
            </Typography>
            <Typography variant="h6" fontWeight={600}>
              {budget.category}
            </Typography>
          </Box>
          <IconButton size="small" color="error" onClick={onDelete}>
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Box>

        <BudgetProgressBar spent={spent} limit={budget.limitAmount} currency={budget.currency} />

        <Box sx={{ display: "flex", justifyContent: "space-between", mt: 1 }}>
          <Typography variant="caption" color="text.secondary">
            Limit: ${budget.limitAmount.toFixed(2)}
          </Typography>
          <Typography
            variant="caption"
            fontWeight={600}
            color={percent >= 90 ? "error.main" : percent >= 70 ? "warning.main" : "text.secondary"}
          >
            ${(budget.limitAmount - spent).toFixed(2)} left
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
}
