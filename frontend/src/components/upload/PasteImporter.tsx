import { useState } from "react";
import { Box, Button, TextField, Typography } from "@mui/material";
import ContentPasteIcon from "@mui/icons-material/ContentPaste";

interface Props {
  onSubmit: (rawText: string) => void;
  loading: boolean;
}

export function PasteImporter({ onSubmit, loading }: Props) {
  const [text, setText] = useState("");

  return (
    <Box sx={{ maxWidth: 700 }}>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
        Copy your transactions from your bank's website and paste them below — any format works.
      </Typography>

      <TextField
        multiline
        rows={10}
        fullWidth
        placeholder={
          "Paste bank transactions here. Any format is fine:\n\nDate    Description    Amount\n02 May\nCUESINE MISSISSAUGA\n$16.04\n\nor tab-separated, or CSV — AI will figure it out."
        }
        value={text}
        onChange={(e) => setText(e.target.value)}
        sx={{
          mb: 2.5,
          "& .MuiInputBase-root": { fontFamily: "monospace", fontSize: "0.8rem" },
        }}
      />

      <Button
        variant="contained"
        size="large"
        fullWidth
        disabled={text.trim().length < 10 || loading}
        startIcon={<ContentPasteIcon />}
        onClick={() => onSubmit(text)}
      >
        {loading ? "Parsing with AI…" : "Import"}
      </Button>
    </Box>
  );
}
