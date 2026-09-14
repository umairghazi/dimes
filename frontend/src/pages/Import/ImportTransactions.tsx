import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Alert, Box } from "@mui/material";
import { financeApi } from "@/api/finance.api";
import { PageHero } from "@/components/finance/PageHero";
import { useMonthStore, isCurrentMonthYear } from "@/store/monthStore";
import { ImportPastePanel } from "@/features/import/ImportPastePanel";
import { ImportPreviewTable } from "@/features/import/ImportPreviewTable";
import {
  findDuplicateImportLines,
  ImportType,
  importSample,
  parseImportRows,
} from "@/features/import/importTransactions";

export function ImportTransactions() {
  const queryClient = useQueryClient();
  const { month, prevMonth, nextMonth } = useMonthStore();
  const isCurrentMonth = isCurrentMonthYear(month);
  const [text, setText] = useState("");
  const [type, setType] = useState<ImportType>("expense");

  const parsedRows = useMemo(() => parseImportRows(text, type, month), [text, type, month]);
  const duplicateLines = useMemo(() => findDuplicateImportLines(parsedRows), [parsedRows]);

  const importMutation = useMutation({
    mutationFn: () => financeApi.importTransactions(parsedRows),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["finance"] });
    },
  });

  return (
    <Box>
      <PageHero
        eyebrow="Sheets import"
        title="Paste transactions"
        description="Paste rows copied from Google Sheets. Missing parent and child categories are created during import."
      />

      <ImportPastePanel
        month={month}
        type={type}
        text={text}
        rowCount={parsedRows.length}
        isCurrentMonth={isCurrentMonth}
        isImporting={importMutation.isPending}
        onPreviousMonth={prevMonth}
        onNextMonth={nextMonth}
        onTextChange={setText}
        onTypeChange={setType}
        onUseSample={() => setText(importSample)}
        onImport={() => void importMutation.mutate()}
      />

      {importMutation.isError && <Alert severity="error" sx={{ mb: 2 }}>Import failed. Check the pasted rows and try again.</Alert>}
      {duplicateLines.size > 0 && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          {duplicateLines.size} pasted rows look duplicated. The server will skip transactions that already exist or repeat in this batch.
        </Alert>
      )}
      {importMutation.data && (
        <Alert severity="success" sx={{ mb: 2 }}>
          Processed {importMutation.data.processedRows} rows. Imported {importMutation.data.transactions.length} transactions and skipped {importMutation.data.skippedDuplicates} duplicates. Created {importMutation.data.createdParents} root categories and {importMutation.data.createdCategories} nested categories.
        </Alert>
      )}

      <ImportPreviewTable rows={parsedRows} duplicateLines={duplicateLines} fallbackMonth={month} />
    </Box>
  );
}
