import { useState, useRef } from "react";
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  Alert,
} from "@mui/material";
import UploadFileIcon from "@mui/icons-material/UploadFile";

interface ColumnMapperProps {
  onSubmit: (file: File, dateColumn: string, amountColumn: string, descriptionColumn: string) => void;
  loading: boolean;
}

export function ColumnMapper({ onSubmit, loading }: ColumnMapperProps) {
  const [file, setFile] = useState<File | null>(null);
  const [dateColumn, setDateColumn] = useState("Date");
  const [amountColumn, setAmountColumn] = useState("Amount");
  const [descriptionColumn, setDescriptionColumn] = useState("Description");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = () => {
    if (!file) return;
    onSubmit(file, dateColumn, amountColumn, descriptionColumn);
  };

  return (
    <Box sx={{ maxWidth: 500 }}>
      {/* File drop zone */}
      <Paper
        variant="outlined"
        sx={{
          p: 4,
          textAlign: "center",
          cursor: "pointer",
          borderStyle: "dashed",
          borderRadius: 3,
          mb: 3,
          "&:hover": { borderColor: "primary.main", bgcolor: "action.hover" },
        }}
        onClick={() => inputRef.current?.click()}
      >
        <UploadFileIcon color="primary" sx={{ fontSize: 48, mb: 1 }} />
        <Typography variant="body1" fontWeight={500}>
          {file ? file.name : "Click to select a CSV file"}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {file ? `${(file.size / 1024).toFixed(1)} KB` : "CSV format only, max 10MB"}
        </Typography>
        <input
          ref={inputRef}
          type="file"
          accept=".csv"
          hidden
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
      </Paper>

      <Alert severity="info" sx={{ mb: 3 }}>
        Enter the exact column header names from your CSV file below. Different banks use different column names.
      </Alert>

      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <TextField
          label="Date Column Header"
          value={dateColumn}
          onChange={(e) => setDateColumn(e.target.value)}
          placeholder="e.g. Date, Transaction Date, Posted Date"
          fullWidth
        />
        <TextField
          label="Amount Column Header"
          value={amountColumn}
          onChange={(e) => setAmountColumn(e.target.value)}
          placeholder="e.g. Amount, Debit, Transaction Amount"
          fullWidth
        />
        <TextField
          label="Description Column Header"
          value={descriptionColumn}
          onChange={(e) => setDescriptionColumn(e.target.value)}
          placeholder="e.g. Description, Merchant, Memo"
          fullWidth
        />
        <Button
          variant="contained"
          size="large"
          disabled={!file || loading}
          onClick={handleSubmit}
          fullWidth
        >
          {loading ? "Processing..." : "Upload & Review"}
        </Button>
      </Box>
    </Box>
  );
}
