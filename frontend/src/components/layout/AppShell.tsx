import { useState } from "react";
import { Box, Drawer, useMediaQuery, useTheme } from "@mui/material";
import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { BottomNav } from "./BottomNav";
import { TopBar } from "./TopBar";
import { QuickAddSheet } from "@/components/quickAdd/QuickAddSheet";
import { tokens } from "@/styles/theme/tokens";

export function AppShell() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isTablet = useMediaQuery(theme.breakpoints.between("sm", "md"));
  const isDesktop = useMediaQuery(theme.breakpoints.up("md"));

  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [quickAddOpen, setQuickAddOpen] = useState(false);

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
          pb: isMobile ? `${tokens.bottomNav.height + 16}px` : 0,
          minHeight: "100vh",
          bgcolor: "background.default",
          overflow: "auto",
        }}
      >
        <Outlet />
      </Box>

      {/* Mobile bottom nav with FAB */}
      {isMobile && <BottomNav onAddClick={() => setQuickAddOpen(true)} />}

      {/* Desktop floating FAB is rendered inside QuickAddSheet */}
      {!isMobile && (
        <Box
          sx={{
            position: "fixed",
            bottom: 32,
            right: 32,
            zIndex: 1100,
          }}
        >
          {/* Desktop FAB rendered by QuickAddFAB component */}
        </Box>
      )}

      {/* Quick Add sheet/dialog */}
      <QuickAddSheet open={quickAddOpen} onClose={() => setQuickAddOpen(false)} />
    </Box>
  );
}
