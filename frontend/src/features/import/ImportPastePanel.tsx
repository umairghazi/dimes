import { Box, Button, MenuItem, Paper, Select, TextField, Typography } from "@mui/material";
import UploadFileOutlinedIcon from "@mui/icons-material/UploadFileOutlined";
import { MonthSwitcher } from "@/components/finance/MonthSwitcher";
import { formatMonthLabel } from "@/components/finance/financeFormat";
import { financeSurfaces } from "@/components/finance/financeStyles";
import { ImportType, importSample } from "./importTransactions";

interface ImportPastePanelProps {
  month: string;
  type: ImportType;
  text: string;
  rowCount: number;
  isCurrentMonth: boolean;
  isImporting: boolean;
  onPreviousMonth: () => void;
  onNextMonth: () => void;
  onTextChange: (value: string) => void;
  onTypeChange: (value: ImportType) => void;
  onUseSample: () => void;
  onImport: () => void;
}

export function ImportPastePanel({
  month,
  type,
  text,
  rowCount,
  isCurrentMonth,
  isImporting,
  onPreviousMonth,
  onNextMonth,
  onTextChange,
  onTypeChange,
  onUseSample,
  onImport,
}: ImportPastePanelProps) {
  return (
    <Paper variant="outlined" sx={{ ...financeSurfaces.panelMuted, p: 2, mb: 2 }}>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2, flexWrap: "wrap", mb: 1.5 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 900 }}>Paste area</Typography>
          <Typography variant="caption" color="text.secondary">
            Supports headers like Date, Description, Amount, Category, Main Category. Imported rows report into {formatMonthLabel(month)}.
          </Typography>
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <MonthSwitcher
            label={formatMonthLabel(month)}
            onPrevious={onPreviousMonth}
            onNext={onNextMonth}
            nextDisabled={isCurrentMonth}
            width={132}
          />
          <Select size="small" value={type} onChange={(event) => onTypeChange(event.target.value as ImportType)}>
            <MenuItem value="expense">Expense default</MenuItem>
            <MenuItem value="income">Income default</MenuItem>
          </Select>
          <Button size="small" variant="outlined" onClick={onUseSample}>Use sample</Button>
        </Box>
      </Box>

      <TextField
        multiline
        minRows={9}
        fullWidth
        placeholder={importSample}
        value={text}
        onChange={(event) => onTextChange(event.target.value)}
      />

      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 2, mt: 2, flexWrap: "wrap" }}>
        <Typography variant="body2" color="text.secondary">
          {rowCount} valid rows ready
        </Typography>
        <Button
          variant="contained"
          startIcon={<UploadFileOutlinedIcon />}
          disabled={rowCount === 0 || isImporting}
          onClick={onImport}
        >
          {isImporting ? "Importing..." : "Import rows"}
        </Button>
      </Box>
    </Paper>
  );
}

