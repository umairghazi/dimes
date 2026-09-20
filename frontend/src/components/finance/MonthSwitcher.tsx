import { IconButton, Typography, Box } from "@mui/material";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { financeSurfaces } from "./financeStyles";

interface MonthSwitcherProps {
  label: string;
  onPrevious: () => void;
  onNext: () => void;
  nextDisabled?: boolean;
  width?: number;
}

export function MonthSwitcher({ label, onPrevious, onNext, nextDisabled = false, width = 150 }: MonthSwitcherProps) {
  return (
    <Box sx={financeSurfaces.toolbar}>
      <IconButton size="small" onClick={onPrevious}>
        <ChevronLeftIcon />
      </IconButton>
      <Typography variant="subtitle1" sx={{ fontWeight: 760, minWidth: width, textAlign: "center" }}>
        {label}
      </Typography>
      <IconButton size="small" onClick={onNext} disabled={nextDisabled}>
        <ChevronRightIcon />
      </IconButton>
    </Box>
  );
}

