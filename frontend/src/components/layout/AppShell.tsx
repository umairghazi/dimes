import { Box, Button, IconButton, Tooltip, Typography } from "@mui/material";
import AnalyticsOutlinedIcon from "@mui/icons-material/AnalyticsOutlined";
import LogoutOutlinedIcon from "@mui/icons-material/LogoutOutlined";
import ReceiptLongOutlinedIcon from "@mui/icons-material/ReceiptLongOutlined";
import SellOutlinedIcon from "@mui/icons-material/SellOutlined";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase/client";
import { useAuthStore } from "@/store/authStore";

export function AppShell() {
  const navigate = useNavigate();
  const clearAuth = useAuthStore((state) => state.clearAuth);

  const signOut = async () => {
    await supabase.auth.signOut();
    clearAuth();
    navigate("/login", { replace: true });
  };

  const navItems = [
    { label: "Overview", path: "/", icon: AnalyticsOutlinedIcon },
    { label: "Ledger", path: "/ledger", icon: ReceiptLongOutlinedIcon },
    { label: "Categories", path: "/categories", icon: SellOutlinedIcon },
  ];

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "background.default",
        backgroundImage: (theme) =>
          theme.palette.mode === "dark"
            ? "linear-gradient(180deg, rgba(255,90,31,0.1) 0%, rgba(15,17,21,0) 360px)"
            : "linear-gradient(180deg, rgba(255,90,31,0.14) 0%, rgba(246,243,238,0) 380px)",
      }}
    >
      <Box
        component="header"
        sx={{
          position: "sticky",
          top: 0,
          zIndex: (theme) => theme.zIndex.appBar,
          borderBottom: "1px solid",
          borderColor: "divider",
          bgcolor: (theme) => theme.palette.mode === "dark" ? "rgba(15,17,21,0.82)" : "rgba(246,243,238,0.8)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
        }}
      >
        <Box
          sx={{
            maxWidth: 1680,
            mx: "auto",
            px: { xs: 1.5, md: 3 },
            py: 1.25,
            display: "grid",
            gridTemplateColumns: { xs: "1fr auto", md: "auto 1fr auto" },
            alignItems: "center",
            gap: { xs: 1, md: 3 },
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, minWidth: 0 }}>
            <Box
              sx={{
                width: 36,
                height: 36,
                display: "grid",
                placeItems: "center",
                borderRadius: 1,
                bgcolor: "primary.main",
                color: "primary.contrastText",
                fontWeight: 900,
              }}
            >
              D
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="h6" sx={{ lineHeight: 1, fontWeight: 900 }}>
                Dimes
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: { xs: "none", sm: "block" } }}>
                Personal finance workspace
              </Typography>
            </Box>
          </Box>

          <Box
            component="nav"
            sx={{
              gridColumn: { xs: "1 / -1", md: "auto" },
              gridRow: { xs: 2, md: "auto" },
              display: "flex",
              alignItems: "center",
              justifyContent: { xs: "stretch", md: "center" },
              gap: 0.75,
              minWidth: 0,
              overflowX: "auto",
            }}
          >
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Button
                  key={item.path}
                  component={NavLink}
                  to={item.path}
                  end={item.path === "/"}
                  startIcon={<Icon fontSize="small" />}
                  sx={{
                    flex: { xs: "1 0 auto", md: "0 0 auto" },
                    minHeight: 40,
                    px: { xs: 1.25, md: 1.75 },
                    color: "text.secondary",
                    borderColor: "transparent",
                    "&.active": {
                      bgcolor: "background.paper",
                      color: "text.primary",
                      borderColor: "divider",
                      boxShadow: (theme) => theme.palette.mode === "dark" ? "none" : "0 10px 28px rgba(18,16,13,0.06)",
                    },
                  }}
                  variant="outlined"
                >
                  {item.label}
                </Button>
              );
            })}
          </Box>

          <Tooltip title="Sign out">
            <IconButton onClick={() => void signOut()} sx={{ justifySelf: "end" }}>
              <LogoutOutlinedIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      <Box
        component="main"
        sx={{
          width: "100%",
          maxWidth: 1680,
          mx: "auto",
          px: { xs: 1.5, md: 3 },
          py: { xs: 2, md: 3 },
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
}
