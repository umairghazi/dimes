import { useNavigate, useLocation } from "react-router-dom";
import {
  Box,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Divider,
  IconButton,
  Tooltip,
} from "@mui/material";
import TableRowsIcon from "@mui/icons-material/TableRows";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import SummarizeIcon from "@mui/icons-material/Summarize";
import Brightness4Icon from "@mui/icons-material/Brightness4";
import Brightness7Icon from "@mui/icons-material/Brightness7";
import LogoutIcon from "@mui/icons-material/Logout";
import { supabase } from "@/lib/supabase/client";
import { tokens } from "@/styles/theme/tokens";
import { useThemeStore } from "@/store/themeStore";
import { useAuthStore } from "@/store/authStore";

const NAV_ITEMS = [
  { label: "Summary", icon: <SummarizeIcon fontSize="small" />, path: "/" },
  { label: "Ledger", icon: <TableRowsIcon fontSize="small" />, path: "/ledger" },
];

interface SidebarProps {
  rail?: boolean;
}

export function Sidebar({ rail = false }: SidebarProps) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { mode, toggleTheme } = useThemeStore();
  const setSession = useAuthStore((s) => s.setSession);
  const width = rail ? tokens.sidebar.railWidth : tokens.sidebar.width;

  const signOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    navigate("/login");
  };

  return (
    <Box
      sx={{
        width,
        flexShrink: 0,
        height: "100vh",
        position: "sticky",
        top: 0,
        display: "flex",
        flexDirection: "column",
        borderRight: "1px solid",
        borderColor: "divider",
        bgcolor: "background.paper",
        overflow: "hidden",
        transition: "width 0.2s ease",
      }}
    >
      {/* Logo */}
      <Box
        sx={{
          px: rail ? 0 : 3,
          height: tokens.topBar.height,
          display: "flex",
          alignItems: "center",
          justifyContent: rail ? "center" : "flex-start",
          gap: 1.5,
          flexShrink: 0,
        }}
      >
        <Box
          sx={{
            width: 30,
            height: 30,
            borderRadius: "8px",
            background: `linear-gradient(135deg, ${tokens.colors.accentDark}, ${tokens.colors.accentLight})`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <AccountBalanceWalletIcon sx={{ color: "#fff", fontSize: 16 }} />
        </Box>
        {!rail && (
          <Typography
            variant="h6"
            sx={{ fontWeight: 800, letterSpacing: "-0.02em", background: `linear-gradient(135deg, ${tokens.colors.accentDark}, ${tokens.colors.accentLight})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}
          >
            Dimes
          </Typography>
        )}
      </Box>

      <Divider />

      {/* Nav */}
      <List sx={{ pt: 1.5, px: rail ? 0.5 : 1.5, flex: 1, gap: 0.25, display: "flex", flexDirection: "column" }}>
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.path || (item.path !== "/" && pathname.startsWith(item.path));
          return (
            <Tooltip key={item.path} title={rail ? item.label : ""} placement="right">
              <ListItemButton
                onClick={() => navigate(item.path)}
                selected={active}
                sx={{
                  borderRadius: "8px",
                  minHeight: 40,
                  flexGrow: 0,
                  justifyContent: rail ? "center" : "flex-start",
                  px: rail ? 1 : 1.5,
                  py: 0.75,
                  mb: 0.25,
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: rail ? 0 : 36,
                    color: active ? "primary.main" : "text.secondary",
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                {!rail && (
                  <ListItemText
                    primary={item.label}
                    slotProps={{ primary: { style: { fontSize: "0.875rem", fontWeight: active ? 600 : 500 } } }}
                  />
                )}
              </ListItemButton>
            </Tooltip>
          );
        })}
      </List>

      <Divider />

      {/* Bottom */}
      <Box sx={{ px: rail ? 0.5 : 1.5, py: 1.5 }}>
        <Box sx={{ display: "flex", justifyContent: rail ? "center" : "flex-end", mt: 0.5, px: 0.5 }}>
          <IconButton onClick={toggleTheme} size="small" sx={{ color: "text.secondary" }}>
            {mode === "dark" ? <Brightness7Icon fontSize="small" /> : <Brightness4Icon fontSize="small" />}
          </IconButton>
          <IconButton onClick={() => void signOut()} size="small" sx={{ color: "text.secondary" }}>
            <LogoutIcon fontSize="small" />
          </IconButton>
        </Box>
      </Box>
    </Box>
  );
}
