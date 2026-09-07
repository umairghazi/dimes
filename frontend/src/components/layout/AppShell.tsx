import { useState } from "react";
import { Box, Drawer, useMediaQuery, useTheme } from "@mui/material";
import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { tokens } from "@/styles/theme/tokens";

export function AppShell() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isTablet = useMediaQuery(theme.breakpoints.between("sm", "md"));
  const isDesktop = useMediaQuery(theme.breakpoints.up("md"));

  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      {/* Desktop: permanent sidebar */}
      {isDesktop && <Sidebar rail={false} />}

      {/* Tablet: icon-only rail */}
      {isTablet && <Sidebar rail={true} />}

      {/* Mobile: hamburger drawer */}
      {isMobile && (
        <>
          <TopBar
            showMenu
            onMenuClick={() => setMobileDrawerOpen(true)}
          />
          <Drawer
            open={mobileDrawerOpen}
            onClose={() => setMobileDrawerOpen(false)}
            ModalProps={{ keepMounted: true }}
          >
            <Sidebar rail={false} />
          </Drawer>
        </>
      )}

      {/* Main content area */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          pt: isMobile ? `${tokens.topBar.height}px` : 0,
          minHeight: "100vh",
          bgcolor: "background.default",
          overflow: "auto",
          backgroundImage: (theme) =>
            theme.palette.mode === "dark"
              ? "linear-gradient(135deg, rgba(255,90,31,0.08), rgba(28,117,216,0.05) 38%, transparent 68%)"
              : "linear-gradient(135deg, rgba(255,90,31,0.1), rgba(28,117,216,0.05) 40%, rgba(255,255,255,0) 72%)",
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
}
