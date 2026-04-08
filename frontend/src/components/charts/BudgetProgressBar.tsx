import { Box, LinearProgress, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import { tokens } from "@/styles/theme/tokens";

const StyledLinearProgress = styled(LinearProgress, {
  shouldForwardProp: (prop) => prop !== "percentUsed",
})<{ percentUsed: number }>(({ percentUsed }) => ({
  height: 10,
  borderRadius: 5,
  "& .MuiLinearProgress-bar": {
    backgroundColor:
      percentUsed >= 90
        ? tokens.colors.budgetRed
        : percentUsed >= 70
          ? tokens.colors.budgetAmber
          : tokens.colors.budgetGreen,
    borderRadius: 5,
  },
}));

interface BudgetProgressBarProps {
  spent: number;
  limit: number;
  currency?: string;
}

export function BudgetProgressBar({
  spent,
  limit,
  currency = "USD",
}: BudgetProgressBarProps) {
  const percent = limit === 0 ? 0 : Math.min((spent / limit) * 100, 100);
  const fmt = (n: number) => `$${n.toFixed(2)}`;

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
        <Typography variant="caption" color="text.secondary">
          {fmt(spent)} of {fmt(limit)} {currency}
        </Typography>
        <Typography
          variant="caption"
          sx={{ fontWeight: 600 }}
          color={
            percent >= 90
              ? "error.main"
              : percent >= 70
                ? "warning.main"
                : "success.main"
          }
        >
          {percent.toFixed(0)}%
        </Typography>
      </Box>
      <StyledLinearProgress variant="determinate" value={percent} percentUsed={percent} />
    </Box>
  );
}
