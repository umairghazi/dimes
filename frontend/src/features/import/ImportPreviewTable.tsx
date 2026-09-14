import { Box, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from "@mui/material";
import { formatMonthLabel, currencyWithCents } from "@/components/finance/financeFormat";
import { financeSurfaces } from "@/components/finance/financeStyles";
import { ParsedImportRow } from "./importTransactions";

interface ImportPreviewTableProps {
  rows: ParsedImportRow[];
  duplicateLines: Set<number>;
  fallbackMonth: string;
}

export function ImportPreviewTable({ rows, duplicateLines, fallbackMonth }: ImportPreviewTableProps) {
  return (
    <Paper variant="outlined" sx={{ ...financeSurfaces.panelMuted, overflow: "hidden" }}>
      <Box sx={{ px: 1.5, py: 1.25, borderBottom: "1px solid", borderColor: "rgba(255,255,255,0.08)", bgcolor: "rgba(15,17,23,0.36)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Typography variant="h5" sx={{ fontWeight: 900 }}>Preview</Typography>
        <Typography variant="caption" color="text.secondary">{rows.length} rows</Typography>
      </Box>
      <TableContainer sx={{ maxHeight: "calc(100vh - 520px)" }}>
        <Table stickyHeader size="small" sx={{ minWidth: 760 }}>
          <TableHead>
            <TableRow>
              <TableCell sx={{ width: 80 }}>Line</TableCell>
              <TableCell sx={{ width: 130 }}>Date</TableCell>
              <TableCell sx={{ width: 150 }}>Reporting month</TableCell>
              <TableCell>Description</TableCell>
              <TableCell align="right" sx={{ width: 120 }}>Amount</TableCell>
              <TableCell sx={{ width: 120 }}>Type</TableCell>
              <TableCell sx={{ width: 260 }}>Category path</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.slice(0, 100).map((row) => {
              const isDuplicate = duplicateLines.has(row.sourceLine);

              return (
                <TableRow
                  key={`${row.sourceLine}-${row.description}`}
                  hover
                  sx={isDuplicate ? { bgcolor: "rgba(255, 184, 77, 0.08)" } : undefined}
                >
                  <TableCell>
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 0.25 }}>
                      <span>{row.sourceLine}</span>
                      {isDuplicate && (
                        <Typography variant="caption" color="warning.main" sx={{ fontWeight: 800 }}>
                          Duplicate
                        </Typography>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>{row.date}</TableCell>
                  <TableCell>{formatMonthLabel(row.monthYear ?? fallbackMonth)}</TableCell>
                  <TableCell>{row.description}</TableCell>
                  <TableCell align="right">{currencyWithCents(row.amount)}</TableCell>
                  <TableCell>{row.type}</TableCell>
                  <TableCell>{row.categoryName || "Uncategorized"}</TableCell>
                </TableRow>
              );
            })}
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={7}>
                  <Typography color="text.secondary" sx={{ py: 3, textAlign: "center" }}>
                    Paste transactions to preview import rows.
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
}
