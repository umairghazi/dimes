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
        backgroundImage:
          "linear-gradient(135deg, rgba(255,107,44,0.16) 0%, rgba(88,101,242,0.12) 36%, rgba(15,17,23,0) 62%), linear-gradient(180deg, #151822 0%, #0f1117 42%)",
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
          bgcolor: "rgba(13,15,21,0.9)",
          backdropFilter: "blur(22px) saturate(130%)",
          WebkitBackdropFilter: "blur(22px) saturate(130%)",
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
                bgcolor: "#ff6b2c",
                color: "#101219",
                fontWeight: 900,
                boxShadow: "0 0 0 3px rgba(255,107,44,0.18), 0 12px 28px rgba(255,107,44,0.24)",
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
                    color: "#b5bbcb",
                    borderColor: "transparent",
                    bgcolor: "rgba(255,255,255,0.04)",
                    boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.04)",
                    "&:hover": {
                      bgcolor: "rgba(255,255,255,0.08)",
                      borderColor: "rgba(255,255,255,0.08)",
                    },
                    "&.active": {
                      bgcolor: "#5865f2",
                      color: "#ffffff",
                      borderColor: "rgba(255,255,255,0.08)",
                      boxShadow: "0 16px 34px rgba(88,101,242,0.28)",
                      "& .MuiButton-startIcon": {
                        color: "#ffffff",
                      },
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
