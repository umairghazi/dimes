import { useState } from "react";
import { Card, CardContent, Box, Typography, IconButton, Collapse } from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

interface Props {
  title: React.ReactNode;
  storageKey: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
  action?: React.ReactNode;
  sx?: object;
  contentSx?: object;
}

export function CollapsibleCard({
  title,
  storageKey,
  defaultOpen = true,
  children,
  action,
  sx,
  contentSx,
}: Props) {
  const [open, setOpen] = useState(() => {
    const stored = localStorage.getItem(`card-open:${storageKey}`);
    return stored === null ? defaultOpen : stored === "true";
  });

  function toggle() {
    setOpen((prev) => {
      localStorage.setItem(`card-open:${storageKey}`, String(!prev));
      return !prev;
    });
  }

  return (
    <Card sx={sx}>
      <Box
        onClick={toggle}
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          px: "20px",
          py: 1.5,
          cursor: "pointer",
          userSelect: "none",
          borderBottom: open ? 1 : 0,
          borderColor: "divider",
          "&:hover": { bgcolor: "action.hover" },
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, flex: 1 }}>
          {typeof title === "string" ? (
            <Typography variant="h6" sx={{ fontWeight: 700 }}>{title}</Typography>
          ) : (
            title
          )}
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }} onClick={(e) => e.stopPropagation()}>
          {action}
          <IconButton size="small" onClick={toggle} sx={{ color: "text.secondary" }}>
            <ExpandMoreIcon
              sx={{
                fontSize: 20,
                transition: "transform 0.2s",
                transform: open ? "rotate(180deg)" : "rotate(0deg)",
              }}
            />
          </IconButton>
        </Box>
      </Box>

      <Collapse in={open} timeout="auto">
        <CardContent sx={{ p: "20px !important", ...contentSx }}>
          {children}
        </CardContent>
      </Collapse>
    </Card>
  );
}
