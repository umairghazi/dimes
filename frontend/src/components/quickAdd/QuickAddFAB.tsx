import { useState } from "react";
import { Fab } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { QuickAddSheet } from "./QuickAddSheet";
import { tokens } from "@/styles/theme/tokens";

interface QuickAddFABProps {
  onSaved?: () => void;
}

export function QuickAddFAB({ onSaved }: QuickAddFABProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Fab
        color="primary"
        onClick={() => setOpen(true)}
        sx={{
          position: "fixed",
          bottom: 32,
          right: 32,
          zIndex: 1100,
          boxShadow: tokens.shadows.fab,
        }}
        aria-label="Add transaction"
      >
        <AddIcon />
      </Fab>
      <QuickAddSheet open={open} onClose={() => setOpen(false)} onSaved={onSaved} />
    </>
  );
}
