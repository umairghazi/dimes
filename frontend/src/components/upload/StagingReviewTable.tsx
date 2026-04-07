import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  MenuItem,
  Select,
  Chip,
  Button,
  Typography,
  Alert,
} from "@mui/material";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import { StagingExpense } from "@/types/upload.types";
import { EXPENSE_CATEGORIES } from "@/types/expense.types";

interface StagingReviewTableProps {
  rows: StagingExpense[];
  onCorrect: (rowId: string, category: string) => void;
  onConfirm: () => void;
  onDiscard: () => void;
  loading: boolean;
  aiAvailable?: boolean;
}

export function StagingReviewTable({
  rows,
  onCorrect,
  onConfirm,
  onDiscard,
  loading,
  aiAvailable = true,
}: StagingReviewTableProps) {
  // A row "needs category" if: no AI (confidence=0) and user hasn't manually picked one
  const uncategorizedCount = rows.filter(
    (r) => r.aiConfidence === 0 && !r.userCorrectedCategory,
  ).length;

  const canConfirm = !loading && uncategorizedCount === 0;

  return (
    <Box>
      {!aiAvailable && (
        <Alert
          severity="info"
          icon={<InfoOutlinedIcon fontSize="inherit" />}
          sx={{ mb: 2 }}
        >
          <strong>AI categorization is not configured.</strong> All transactions are marked as
          "Uncategorized" — please assign a category to each row using the dropdown before
          importing.
        </Alert>
      )}

      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
        <Box>
          <Typography variant="body1" color="text.secondary">
            {rows.length} transactions ready to review.
          </Typography>
          {uncategorizedCount > 0 && (
            <Typography variant="caption" color="warning.main" fontWeight={600}>
              {uncategorizedCount} row{uncategorizedCount !== 1 ? "s" : ""} still need a category.
            </Typography>
          )}
        </Box>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button variant="outlined" color="error" onClick={onDiscard} disabled={loading}>
            Discard
          </Button>
          <Button
            variant="contained"
            onClick={onConfirm}
            disabled={!canConfirm}
            title={uncategorizedCount > 0 ? "Assign a category to all rows before importing" : undefined}
          >
            {loading ? "Importing..." : `Confirm Import (${rows.length})`}
          </Button>
        </Box>
      </Box>

      <Paper sx={{ borderRadius: 2, overflow: "hidden" }}>
        <TableContainer sx={{ maxHeight: 500 }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Amount</TableCell>
                {aiAvailable && <TableCell>AI Category</TableCell>}
                {aiAvailable && <TableCell>Confidence</TableCell>}
                <TableCell>Category</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((row) => {
                const effectiveCategory = row.userCorrectedCategory ?? row.aiSuggestedCategory;
                const needsCategory = row.aiConfidence === 0 && !row.userCorrectedCategory;
                const confidence = row.aiConfidence;
                const isLowConfidence = aiAvailable && confidence < 0.85;

                return (
                  <TableRow
                    key={row.id}
                    sx={{
                      bgcolor: needsCategory
                        ? "error.light"
                        : isLowConfidence
                          ? "warning.light"
                          : "inherit",
                      opacity: needsCategory || isLowConfidence ? 0.9 : 1,
                    }}
                  >
                    <TableCell>{new Date(row.date).toLocaleDateString()}</TableCell>
                    <TableCell sx={{ maxWidth: 200 }}>
                      <Typography variant="body2" noWrap title={row.description}>
                        {row.description}
                      </Typography>
                    </TableCell>
                    <TableCell>${row.amount.toFixed(2)}</TableCell>
                    {aiAvailable && (
                      <TableCell>
                        <Chip label={row.aiSuggestedCategory} size="small" variant="outlined" />
                      </TableCell>
                    )}
                    {aiAvailable && (
                      <TableCell>
                        <Chip
                          label={`${(confidence * 100).toFixed(0)}%`}
                          size="small"
                          color={confidence >= 0.85 ? "success" : confidence >= 0.6 ? "warning" : "error"}
                        />
                      </TableCell>
                    )}
                    <TableCell>
                      <Select
                        value={effectiveCategory}
                        size="small"
                        onChange={(e) => onCorrect(row.id, e.target.value)}
                        sx={{ minWidth: 160 }}
                        displayEmpty
                      >
                        <MenuItem value="Uncategorized" disabled>
                          <em>Select a category…</em>
                        </MenuItem>
                        {EXPENSE_CATEGORIES.map((c) => (
                          <MenuItem key={c} value={c}>{c}</MenuItem>
                        ))}
                      </Select>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
}
