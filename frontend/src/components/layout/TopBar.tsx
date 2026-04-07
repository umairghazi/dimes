import { AppBar, Toolbar, Typography, IconButton, Box, Avatar } from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import Brightness4Icon from "@mui/icons-material/Brightness4";
import Brightness7Icon from "@mui/icons-material/Brightness7";
import { useThemeStore } from "@/store/themeStore";
import { useAuthStore } from "@/store/authStore";
import { tokens } from "@/styles/theme/tokens";

interface TopBarProps {
  onMenuClick?: () => void;
  showMenu?: boolean;
}

export function TopBar({ onMenuClick, showMenu = false }: TopBarProps) {
  const { mode, toggleTheme } = useThemeStore();
  const user = useAuthStore((s) => s.user);

  return (
    <AppBar
      position="fixed"
      elevation={0}
      sx={{
        height: tokens.topBar.height,
        color: "text.primary",
        zIndex: (theme) => theme.zIndex.drawer + 1,
      }}
    >
      <Toolbar sx={{ height: "100%", gap: 1 }}>
        {showMenu && (
          <IconButton edge="start" onClick={onMenuClick} size="small" sx={{ color: "text.secondary" }}>
            <MenuIcon />
          </IconButton>
        )}

        {/* Mobile logo */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            flex: 1,
          }}
        >
          <Box
            sx={{
              width: 26,
              height: 26,
              borderRadius: "7px",
              background: `linear-gradient(135deg, ${tokens.colors.accentDark}, ${tokens.colors.accentLight})`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Typography sx={{ color: "#fff", fontSize: 12, fontWeight: 800 }}>D</Typography>
          </Box>
          <Typography
            variant="h6"
            fontWeight={800}
            sx={{
              letterSpacing: "-0.02em",
              fontSize: "1rem",
              background: `linear-gradient(135deg, ${tokens.colors.accentDark}, ${tokens.colors.accentLight})`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Dimes
          </Typography>
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
          <IconButton onClick={toggleTheme} size="small" sx={{ color: "text.secondary" }}>
            {mode === "dark" ? <Brightness7Icon fontSize="small" /> : <Brightness4Icon fontSize="small" />}
          </IconButton>
          {user && (
            <Avatar
              sx={{
                width: 30,
                height: 30,
                fontSize: "0.75rem",
                fontWeight: 700,
                bgcolor: tokens.colors.accentBg,
                color: tokens.colors.accent,
                border: `1.5px solid ${tokens.colors.accentBorder}`,
              }}
            >
              {user.email[0].toUpperCase()}
            </Avatar>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
}
