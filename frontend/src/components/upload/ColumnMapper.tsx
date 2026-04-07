import { useState, useRef, useCallback } from "react";
import {
  Box,
  Button,
  Paper,
  Typography,
  Select,
  MenuItem,
  FormControl,
  FormControlLabel,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  Chip,
} from "@mui/material";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import Papa from "papaparse";

type ColumnRole = "date" | "debit" | "credit" | "description" | "ignore";

const ROLE_LABELS: Record<ColumnRole, string> = {
  date: "Date",
  debit: "Debit",
  credit: "Credit",
  description: "Description",
  ignore: "Ignore",
};

const ROLE_COLORS: Partial<Record<ColumnRole, "primary" | "success" | "error" | "warning">> = {
  date: "primary",
  debit: "error",
  credit: "success",
  description: "warning",
};

// Required roles — credit is optional
const REQUIRED_ROLES: ColumnRole[] = ["date", "debit", "description"];

interface ColumnMapperProps {
  onSubmit: (
    file: File,
    dateIndex: number,
    debitIndex: number,
    creditIndex: number,
    descriptionIndex: number,
    hasHeader: boolean,
  ) => void;
  loading: boolean;
}

function detectRole(values: string[]): ColumnRole {
  const nonEmpty = values.filter(Boolean);
  if (nonEmpty.length === 0) return "ignore";

  const datePattern = /^\d{1,4}[-\/\.]\d{1,2}[-\/\.]\d{1,4}$|^\w+ \d{1,2},? \d{4}/i;
  const amountPattern = /^-?[\$£€]?\s*\d[\d,]*\.?\d*$/;

  const ratio = (n: number) => n / nonEmpty.length;
  const dateLike = nonEmpty.filter((v) => datePattern.test(v.trim())).length;
  const amountLike = nonEmpty.filter((v) => amountPattern.test(v.trim())).length;

  if (ratio(dateLike) > 0.5) return "date";
  if (ratio(amountLike) > 0.5) return "debit";
  return "description";
}

function autoAssign(columns: string[][]): ColumnRole[] {
  const detected = columns.map(detectRole);
  const roles: ColumnRole[] = detected.map(() => "ignore");
  const taken = new Set<ColumnRole>();

  detected.forEach((role, i) => {
    if (role !== "ignore" && !taken.has(role)) {
      roles[i] = role;
      taken.add(role);
    }
  });

  if (!taken.has("description")) {
    const idx = roles.findIndex((r) => r === "ignore");
    if (idx !== -1) {
      roles[idx] = "description";
      taken.add("description");
    }
  }

  return roles;
}

const PREVIEW_ROWS = 5;

export function ColumnMapper({ onSubmit, loading }: ColumnMapperProps) {
  const [file, setFile] = useState<File | null>(null);
  const [rawRows, setRawRows] = useState<string[][]>([]);
  const [columnRoles, setColumnRoles] = useState<ColumnRole[]>([]);
  const [hasHeader, setHasHeader] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const parseFile = useCallback((f: File) => {
    Papa.parse<string[]>(f, {
      header: false,
      skipEmptyLines: true,
      preview: PREVIEW_ROWS + 1,
      complete: ({ data }) => {
        setRawRows(data as string[][]);
        const colCount = Math.max(...(data as string[][]).map((r) => r.length));
        const cols: string[][] = Array.from({ length: colCount }, (_, ci) =>
          (data as string[][]).map((row) => row[ci] ?? ""),
        );
        setColumnRoles(autoAssign(cols));
        if (data.length > 0) {
          const firstRow = data[0] as string[];
          const looksLikeHeader = firstRow.every((cell) =>
            isNaN(Number(cell.replace(/[,$%]/g, "")))
          );
          setHasHeader(looksLikeHeader);
        }
      },
    });
  }, []);

  const handleFile = (f: File) => {
    setFile(f);
    parseFile(f);
  };

  const setRole = (colIndex: number, role: ColumnRole) => {
    setColumnRoles((prev) => {
      const next = [...prev];
      if (role !== "ignore") {
        next.forEach((r, i) => { if (r === role) next[i] = "ignore"; });
      }
      next[colIndex] = role;
      return next;
    });
  };

  const dateIndex = columnRoles.indexOf("date");
  const debitIndex = columnRoles.indexOf("debit");
  const creditIndex = columnRoles.indexOf("credit"); // -1 if not assigned (optional)
  const descriptionIndex = columnRoles.indexOf("description");
  const ready = file && dateIndex !== -1 && debitIndex !== -1 && descriptionIndex !== -1;

  const missingRoles = REQUIRED_ROLES.filter((r) => !columnRoles.includes(r));

  const displayRows = hasHeader ? rawRows.slice(1) : rawRows;
  const colCount = rawRows.length > 0 ? Math.max(...rawRows.map((r) => r.length)) : 0;

  return (
    <Box sx={{ maxWidth: 700 }}>
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
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
          }}
        />
      </Paper>

      {rawRows.length > 0 && (
        <>
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
            <Typography variant="subtitle1" fontWeight={600}>
              Map your columns
            </Typography>
            <FormControlLabel
              control={
                <Switch
                  checked={hasHeader}
                  onChange={(e) => setHasHeader(e.target.checked)}
                  size="small"
                />
              }
              label={
                <Typography variant="body2" color="text.secondary">
                  First row is a header
                </Typography>
              }
              labelPlacement="start"
            />
          </Box>

          {missingRoles.length > 0 && (
            <Alert severity="info" sx={{ mb: 2 }}>
              Assign each column below. Still missing:{" "}
              {missingRoles.map((r) => (
                <strong key={r}> {ROLE_LABELS[r]}</strong>
              ))}
            </Alert>
          )}

          <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2, mb: 3 }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: "action.hover" }}>
                  {Array.from({ length: colCount }, (_, ci) => (
                    <TableCell key={ci} sx={{ py: 1, minWidth: 130 }}>
                      <FormControl size="small" fullWidth>
                        <Select
                          value={columnRoles[ci] ?? "ignore"}
                          onChange={(e) => setRole(ci, e.target.value as ColumnRole)}
                          renderValue={(val) => {
                            const color = ROLE_COLORS[val as ColumnRole];
                            return color ? (
                              <Chip label={ROLE_LABELS[val as ColumnRole]} color={color} size="small" />
                            ) : (
                              <Typography variant="caption" color="text.disabled">Ignore</Typography>
                            );
                          }}
                          sx={{ "& .MuiSelect-select": { py: 0.5 } }}
                        >
                          <MenuItem value="date">Date</MenuItem>
                          <MenuItem value="debit">Debit (expenses)</MenuItem>
                          <MenuItem value="credit">Credit (income / refunds)</MenuItem>
                          <MenuItem value="description">Description</MenuItem>
                          <MenuItem value="ignore">Ignore</MenuItem>
                        </Select>
                      </FormControl>
                    </TableCell>
                  ))}
                </TableRow>

                {hasHeader && rawRows.length > 0 && (
                  <TableRow>
                    {rawRows[0].map((cell, ci) => (
                      <TableCell
                        key={ci}
                        sx={{ fontWeight: 700, color: "text.secondary", fontSize: "0.75rem", py: 0.75 }}
                      >
                        {cell}
                      </TableCell>
                    ))}
                  </TableRow>
                )}
              </TableHead>

              <TableBody>
                {displayRows.slice(0, PREVIEW_ROWS).map((row, ri) => (
                  <TableRow key={ri} hover>
                    {Array.from({ length: colCount }, (_, ci) => {
                      const role = columnRoles[ci] ?? "ignore";
                      const highlight = role !== "ignore";
                      return (
                        <TableCell
                          key={ci}
                          sx={{
                            fontSize: "0.8rem",
                            py: 0.75,
                            color: highlight ? "text.primary" : "text.disabled",
                            fontStyle: highlight ? "normal" : "italic",
                          }}
                        >
                          {row[ci] ?? ""}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}

      <Button
        variant="contained"
        size="large"
        disabled={!ready || loading}
        onClick={() => {
          if (!file || !ready) return;
          onSubmit(file, dateIndex, debitIndex, creditIndex, descriptionIndex, hasHeader);
        }}
        fullWidth
      >
        {loading ? "Processing..." : "Upload & Review"}
      </Button>
    </Box>
  );
}
