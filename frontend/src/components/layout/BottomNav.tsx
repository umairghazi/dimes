import { useNavigate, useLocation } from "react-router-dom";
import {
  BottomNavigation,
  BottomNavigationAction,
  Paper,
  Fab,
} from "@mui/material";
import DashboardIcon from "@mui/icons-material/Dashboard";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import AddIcon from "@mui/icons-material/Add";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import { tokens } from "@/styles/theme/tokens";

interface BottomNavProps {
  onAddClick: () => void;
}

const TAB_PATHS = ["/", "/expenses", null, "/categories", "/upload"];

export function BottomNav({ onAddClick }: BottomNavProps) {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const tabValue = TAB_PATHS.findIndex(
    (p) => p !== null && (p === "/" ? pathname === "/" : pathname.startsWith(p)),
  );

  const handleChange = (_: unknown, newValue: number) => {
    if (newValue === 2) return; // center is FAB
    const path = TAB_PATHS[newValue];
    if (path) navigate(path);
  };

  return (
    <Paper
      sx={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 1200,
        borderTop: "1px solid",
        borderColor: "divider",
      }}
      elevation={0}
    >
      <BottomNavigation value={tabValue === -1 ? false : tabValue} onChange={handleChange}>
        <BottomNavigationAction label="Dashboard" icon={<DashboardIcon />} />
        <BottomNavigationAction label="Expenses" icon={<ReceiptLongIcon />} />
        {/* Center slot - empty, FAB overlaps it */}
        <BottomNavigationAction
          icon={<span />}
          sx={{ pointerEvents: "none", opacity: 0 }}
        />
        <BottomNavigationAction label="Categories" icon={<AccountBalanceWalletIcon />} />
        <BottomNavigationAction label="Upload" icon={<UploadFileIcon />} />
      </BottomNavigation>

      {/* FAB overlapping the center slot */}
      <Fab
        color="primary"
        onClick={onAddClick}
        sx={{
          position: "absolute",
          top: -28,
          left: "50%",
          transform: "translateX(-50%)",
          boxShadow: tokens.shadows.fab,
        }}
        aria-label="Add transaction"
      >
        <AddIcon />
      </Fab>
    </Paper>
  );
}
