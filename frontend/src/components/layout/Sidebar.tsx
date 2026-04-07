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
import DashboardIcon from "@mui/icons-material/Dashboard";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import BarChartIcon from "@mui/icons-material/BarChart";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import SettingsIcon from "@mui/icons-material/Settings";
import Brightness4Icon from "@mui/icons-material/Brightness4";
import Brightness7Icon from "@mui/icons-material/Brightness7";
import { tokens } from "@/styles/theme/tokens";
import { useThemeStore } from "@/store/themeStore";

const NAV_ITEMS = [
  { label: "Dashboard", icon: <DashboardIcon fontSize="small" />, path: "/" },
  { label: "Expenses", icon: <ReceiptLongIcon fontSize="small" />, path: "/expenses" },
  { label: "Upload", icon: <UploadFileIcon fontSize="small" />, path: "/upload" },
  { label: "Categories", icon: <AccountBalanceWalletIcon fontSize="small" />, path: "/categories" },
  { label: "Analytics", icon: <BarChartIcon fontSize="small" />, path: "/analytics" },
];

interface SidebarProps {
  rail?: boolean;
}

export function Sidebar({ rail = false }: SidebarProps) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { mode, toggleTheme } = useThemeStore();
  const width = rail ? tokens.sidebar.railWidth : tokens.sidebar.width;

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
            fontWeight={800}
            sx={{ letterSpacing: "-0.02em", background: `linear-gradient(135deg, ${tokens.colors.accentDark}, ${tokens.colors.accentLight})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}
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
                    primaryTypographyProps={{ fontSize: "0.875rem", fontWeight: active ? 600 : 500 }}
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
        <Tooltip title={rail ? "Settings" : ""} placement="right">
          <ListItemButton
            onClick={() => navigate("/settings")}
            sx={{ borderRadius: "8px", minHeight: 40, justifyContent: rail ? "center" : "flex-start", px: rail ? 1 : 1.5 }}
          >
            <ListItemIcon sx={{ minWidth: rail ? 0 : 36, color: "text.secondary" }}>
              <SettingsIcon fontSize="small" />
            </ListItemIcon>
            {!rail && (
              <ListItemText primary="Settings" primaryTypographyProps={{ fontSize: "0.875rem", fontWeight: 500 }} />
            )}
          </ListItemButton>
        </Tooltip>

        <Box sx={{ display: "flex", justifyContent: rail ? "center" : "flex-end", mt: 0.5, px: 0.5 }}>
          <IconButton onClick={toggleTheme} size="small" sx={{ color: "text.secondary" }}>
            {mode === "dark" ? <Brightness7Icon fontSize="small" /> : <Brightness4Icon fontSize="small" />}
          </IconButton>
        </Box>
      </Box>
    </Box>
  );
}
