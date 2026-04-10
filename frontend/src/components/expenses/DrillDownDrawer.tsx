import {
  Drawer,
  Box,
  Typography,
  IconButton,
  Divider,
  List,
  ListItem,
  ListItemText,
  Button,
  Skeleton,
  Alert,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { expensesApi } from "@/api/expenses.api";
import { useCategories } from "@/hooks/useCategories";
import { useFilterStore } from "@/store/filterStore";
import { formatDate } from "@/lib/date";

export interface DrillDown {
  category?: string;
  month: string; // "YYYY-MM"
}

interface Props {
  open: boolean;
  onClose: () => void;
  drillDown: DrillDown | null;
}

function monthToRange(month: string): { dateFrom: string; dateTo: string } {
  const [year, mo] = month.split("-").map(Number);
  const lastDay = new Date(year, mo, 0).getDate();
  return {
    dateFrom: `${month}-01`,
    dateTo: `${month}-${String(lastDay).padStart(2, "0")}`,
  };
}

function formatMonthLabel(month: string): string {
  const [year, mo] = month.split("-").map(Number);
  return new Date(year, mo - 1, 1).toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });
}

export function DrillDownDrawer({ open, onClose, drillDown }: Props) {
  const navigate = useNavigate();
  const { clearFilters, setFilter } = useFilterStore();
  const { categories } = useCategories();

  // Resolve category name → id for filtering
  const categoryId = drillDown?.category
    ? (categories.find((c) => c.name === drillDown.category)?.id ?? undefined)
    : undefined;

  const range = drillDown ? monthToRange(drillDown.month) : null;

  const { data, isLoading, isError } = useQuery({
    queryKey: ["drilldown", drillDown?.category, drillDown?.month],
    queryFn: () =>
      expensesApi.list({
        categoryId,
        dateFrom: range!.dateFrom,
        dateTo: range!.dateTo,
        page: 1,
        limit: 250,
      }),
    enabled: open && drillDown !== null,
    staleTime: 2 * 60 * 1000,
  });

  const expenses = data?.data ?? [];
  const total = expenses.reduce((sum, e) => sum + e.amount, 0);

  const handleOpenInExpenses = () => {
    clearFilters();
    if (categoryId) setFilter("categoryId", categoryId);
    setFilter("dateFrom", range!.dateFrom);
    setFilter("dateTo", range!.dateTo);
    onClose();
    navigate("/expenses");
  };

  const title = drillDown
    ? drillDown.category
      ? `${drillDown.category}`
      : "All Transactions"
    : "";

  const subtitle = drillDown ? formatMonthLabel(drillDown.month) : "";

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      slotProps={{ paper: { sx: { width: { xs: "100%", sm: 420 } } } }}
    >
      <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
        {/* Header */}
        <Box sx={{ px: 2.5, pt: 2.5, pb: 1.5 }}>
          <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                {title}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
                {subtitle}
              </Typography>
            </Box>
            <IconButton size="small" onClick={onClose} sx={{ mt: -0.5 }}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
        </Box>

        <Divider />

        {/* Body */}
        <Box sx={{ flex: 1, overflow: "auto" }}>
          {isLoading ? (
            <Box sx={{ px: 2.5, pt: 2 }}>
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} height={52} sx={{ mb: 0.5 }} />
              ))}
            </Box>
          ) : isError ? (
            <Alert severity="error" sx={{ m: 2 }}>Failed to load transactions</Alert>
          ) : expenses.length === 0 ? (
            <Box sx={{ px: 2.5, pt: 4, textAlign: "center" }}>
              <Typography color="text.secondary">No transactions found</Typography>
            </Box>
          ) : (
            <List disablePadding>
              {expenses.map((expense, i) => (
                <ListItem
                  key={expense.id}
                  divider={i < expenses.length - 1}
                  sx={{ px: 2.5, py: 1.25 }}
                >
                  <ListItemText
                    primary={expense.description}
                    secondary={formatDate(expense.date)}
                    slotProps={{
                      primary: { style: { fontSize: "0.875rem", fontWeight: 500 } },
                      secondary: { style: { fontSize: "0.75rem" } },
                    }}
                  />
                  <Typography
                    variant="body2"
                    sx={{ fontWeight: 600, fontVariantNumeric: "tabular-nums", ml: 2, whiteSpace: "nowrap" }}
                  >
                    ${expense.amount.toFixed(2)}
                  </Typography>
                </ListItem>
              ))}
            </List>
          )}
        </Box>

        {/* Footer */}
        {expenses.length > 0 && (
          <>
            <Divider />
            <Box sx={{ px: 2.5, py: 1.5 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.5 }}>
                <Typography variant="body2" color="text.secondary">
                  {expenses.length} transaction{expenses.length !== 1 ? "s" : ""}
                </Typography>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>
                  Total: ${total.toFixed(2)}
                </Typography>
              </Box>
              <Button
                fullWidth
                variant="outlined"
                size="small"
                endIcon={<OpenInNewIcon fontSize="small" />}
                onClick={handleOpenInExpenses}
              >
                Open in Expenses
              </Button>
            </Box>
          </>
        )}
      </Box>
    </Drawer>
  );
}
