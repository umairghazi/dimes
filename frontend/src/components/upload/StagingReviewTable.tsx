import { useState } from "react";
import { formatDate } from "@/lib/date";
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Button,
  IconButton,
  Tooltip,
  Typography,
  Alert,
  Input,
} from "@mui/material";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlined";
import CallSplitIcon from "@mui/icons-material/CallSplit";
import { StagingExpense } from "@/types/upload.types";
import { CategorySelect } from "@/components/shared/CategorySelect";
import { SplitTransactionDialog } from "./SplitTransactionDialog";

interface StagingReviewTableProps {
  rows: StagingExpense[];
  onCorrect: (rowId: string, category: string) => void;
  onEditDescription: (rowId: string, description: string) => void;
  onSplit: (rowId: string, splits: { description: string; amount: number; category: string }[]) => void;
  onSkip: (rowId: string) => void;
  onConfirm: () => void;
  onDiscard: () => void;
  loading: boolean;
  aiAvailable?: boolean;
}

export function StagingReviewTable({
  rows,
  onCorrect,
  onEditDescription,
  onSplit,
  onSkip,
  onConfirm,
  onDiscard,
  loading,
  aiAvailable = true,
}: StagingReviewTableProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [splitRow, setSplitRow] = useState<StagingExpense | null>(null);

  const uncategorizedCount = rows.filter(
    (r) => !(r.userCorrectedCategory ?? r.aiSuggestedCategory),
  ).length;

  const canConfirm = !loading && uncategorizedCount === 0;

  const startEdit = (row: StagingExpense) => {
    setEditingId(row.id);
    setEditValue(row.description);
  };

  const commitEdit = (rowId: string) => {
    const trimmed = editValue.trim();
    if (trimmed && trimmed !== rows.find((r) => r.id === rowId)?.description) {
      onEditDescription(rowId, trimmed);
    }
    setEditingId(null);
  };

  const handleSplitConfirm = (splits: { description: string; amount: number; category: string }[]) => {
    if (!splitRow) return;
    onSplit(splitRow.id, splits);
    setSplitRow(null);
  };

  return (
    <Box>
      {!aiAvailable && (
        <Alert
          severity="info"
          icon={<InfoOutlinedIcon fontSize="inherit" />}
          sx={{ mb: 2 }}
        >
          Transactions have been marked as <strong>Miscellaneous</strong>. You can reassign
          categories here or update them later from the Expenses tab.
        </Alert>
      )}

      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
        <Box>
          <Typography variant="body1" color="text.secondary">
            {rows.length} transactions ready to review.
          </Typography>
          {uncategorizedCount > 0 && (
            <Typography variant="caption" color="warning.main" sx={{ fontWeight: 600 }}>
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
                <TableCell />
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((row) => {
                const effectiveCategory = row.userCorrectedCategory ?? row.aiSuggestedCategory;
                const needsCategory = !effectiveCategory;
                const confidence = row.aiConfidence;
                const isHistory = row.classificationSource === "history";
                const isLowConfidence = aiAvailable && !isHistory && confidence > 0 && confidence < 0.85;
                const isEditingDesc = editingId === row.id;

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
                    <TableCell>{formatDate(row.date)}</TableCell>
                    <TableCell sx={{ maxWidth: 200 }}>
                      {isEditingDesc ? (
                        <Input
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={() => commitEdit(row.id)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") commitEdit(row.id);
                            if (e.key === "Escape") setEditingId(null);
                          }}
                          autoFocus
                          size="small"
                          fullWidth
                          sx={{ fontSize: "0.875rem" }}
                        />
                      ) : (
                        <Tooltip title="Click to edit description">
                          <Typography
                            variant="body2"
                            noWrap
                            onClick={() => startEdit(row)}
                            sx={{
                              cursor: "text",
                              borderBottom: "1px dashed",
                              borderColor: "divider",
                              display: "inline-block",
                              maxWidth: "100%",
                              "&:hover": { borderColor: "primary.main", color: "primary.main" },
                            }}
                          >
                            {row.description}
                          </Typography>
                        </Tooltip>
                      )}
                    </TableCell>
                    <TableCell>${row.amount.toFixed(2)}</TableCell>
                    {aiAvailable && (
                      <TableCell>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                          <Chip label={row.aiSuggestedCategory} size="small" variant="outlined" />
                          <Chip
                            label={isHistory ? "History" : "AI"}
                            size="small"
                            color={isHistory ? "info" : "secondary"}
                            variant="filled"
                            sx={{ fontSize: "0.65rem", height: 18, "& .MuiChip-label": { px: 0.75 } }}
                          />
                        </Box>
                      </TableCell>
                    )}
                    {aiAvailable && (
                      <TableCell>
                        {isHistory ? (
                          <Tooltip title="Matched from your expense history">
                            <Chip
                              label={`${(confidence * 100).toFixed(0)}%`}
                              size="small"
                              color="info"
                              variant="outlined"
                            />
                          </Tooltip>
                        ) : (
                          <Chip
                            label={`${(confidence * 100).toFixed(0)}%`}
                            size="small"
                            color={confidence >= 0.85 ? "success" : confidence >= 0.6 ? "warning" : "error"}
                          />
                        )}
                      </TableCell>
                    )}
                    <TableCell>
                      <CategorySelect
                        value={effectiveCategory}
                        size="small"
                        onChange={(e) => onCorrect(row.id, e.target.value as string)}
                        sx={{ minWidth: 180 }}
                        displayEmpty
                        valueBy="name"
                      />
                    </TableCell>
                    <TableCell padding="none">
                      <Box sx={{ display: "flex" }}>
                        <Tooltip title="Split into multiple transactions">
                          <IconButton size="small" onClick={() => setSplitRow(row)} color="default">
                            <CallSplitIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Skip this row">
                          <IconButton size="small" onClick={() => onSkip(row.id)} color="default">
                            <DeleteOutlineIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <SplitTransactionDialog
        open={splitRow !== null}
        row={splitRow}
        onClose={() => setSplitRow(null)}
        onConfirm={handleSplitConfirm}
      />
    </Box>
  );
}
