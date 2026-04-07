import { useState } from "react";
import {
  Box,
  TextField,
  IconButton,
  ToggleButtonGroup,
  ToggleButton,
  Paper,
  Typography,
  CircularProgress,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import AddIcon from "@mui/icons-material/Add";
import { useNLQuery } from "@/hooks/useNLQuery";
import { QueryResultCard } from "./QueryResultCard";

export function NLQueryBar() {
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<"ask" | "add">("ask");
  const { result, loading, error, query, clear } = useNLQuery();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    await query(input.trim(), mode);
  };

  return (
    <Box sx={{ mb: 3 }}>
      <Paper
        component="form"
        onSubmit={(e) => void handleSubmit(e)}
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          p: 1,
          borderRadius: 3,
          boxShadow: 2,
        }}
      >
        <ToggleButtonGroup
          value={mode}
          exclusive
          onChange={(_, val) => { if (val) { setMode(val as "ask" | "add"); clear(); } }}
          size="small"
        >
          <ToggleButton value="ask" sx={{ gap: 0.5, fontSize: 12 }}>
            <SearchIcon fontSize="inherit" /> Ask
          </ToggleButton>
          <ToggleButton value="add" sx={{ gap: 0.5, fontSize: 12 }}>
            <AddIcon fontSize="inherit" /> Add
          </ToggleButton>
        </ToggleButtonGroup>

        <TextField
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={
            mode === "ask"
              ? "e.g. How much did I spend on food in March?"
              : "e.g. spent $24 on lunch at chipotle today"
          }
          variant="standard"
          InputProps={{ disableUnderline: true }}
          sx={{ flex: 1 }}
        />

        <IconButton type="submit" disabled={loading || !input.trim()}>
          {loading ? <CircularProgress size={20} /> : <SearchIcon />}
        </IconButton>
      </Paper>

      {error && (
        <Typography variant="caption" color="error" sx={{ ml: 1 }}>
          {error}
        </Typography>
      )}

      {result && <QueryResultCard result={result} mode={mode} onDismiss={clear} />}
    </Box>
  );
}
