import { createTheme, alpha } from "@mui/material/styles";
import { tokens } from "./tokens";
import { typography } from "./typography";

export const darkTheme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: tokens.colors.accentLight,
      dark: tokens.colors.accent,
      light: "#a78bfa",
      contrastText: "#ffffff",
    },
    secondary: { main: "#38bdf8" },
    success: { main: "#4ade80" },
    warning: { main: "#fbbf24" },
    error: { main: "#f87171" },
    info: { main: "#38bdf8" },
    background: {
      default: tokens.colors.bgDark,
      paper: tokens.colors.surfaceDark,
    },
    text: {
      primary: tokens.colors.textPrimaryDark,
      secondary: tokens.colors.textSecondaryDark,
    },
    divider: tokens.colors.borderDark,
  },

  typography: {
    ...typography,
  },

  shape: { borderRadius: 10 },

  shadows: [
    "none",
    "0 1px 2px rgba(0,0,0,0.3)",
    "0 1px 3px rgba(0,0,0,0.4), 0 1px 2px rgba(0,0,0,0.3)",
    "0 4px 6px rgba(0,0,0,0.4)",
    "0 10px 15px rgba(0,0,0,0.5)",
    "0 20px 25px rgba(0,0,0,0.6)",
    "0 20px 25px rgba(0,0,0,0.6)",
    "0 20px 25px rgba(0,0,0,0.6)",
    "0 20px 25px rgba(0,0,0,0.6)",
    "0 20px 25px rgba(0,0,0,0.6)",
    "0 20px 25px rgba(0,0,0,0.6)",
    "0 20px 25px rgba(0,0,0,0.6)",
    "0 20px 25px rgba(0,0,0,0.6)",
    "0 20px 25px rgba(0,0,0,0.6)",
    "0 20px 25px rgba(0,0,0,0.6)",
    "0 20px 25px rgba(0,0,0,0.6)",
    "0 20px 25px rgba(0,0,0,0.6)",
    "0 20px 25px rgba(0,0,0,0.6)",
    "0 20px 25px rgba(0,0,0,0.6)",
    "0 20px 25px rgba(0,0,0,0.6)",
    "0 20px 25px rgba(0,0,0,0.6)",
    "0 20px 25px rgba(0,0,0,0.6)",
    "0 20px 25px rgba(0,0,0,0.6)",
    "0 20px 25px rgba(0,0,0,0.6)",
    "0 20px 25px rgba(0,0,0,0.6)",
  ],

  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          fontFamily: tokens.font.sans,
          WebkitFontSmoothing: "antialiased",
          MozOsxFontSmoothing: "grayscale",
          textRendering: "optimizeLegibility",
        },
      },
    },

    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: "none",
          border: `1px solid ${tokens.colors.borderDark}`,
          borderRadius: tokens.radii.lg,
          backgroundImage: "none",
          transition: "border-color 0.2s ease",
          "&:hover": {
            borderColor: "#3d3650",
          },
        },
      },
    },

    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
          fontWeight: 600,
          borderRadius: tokens.radii.md,
          transition: "all 0.15s ease",
        },
        contained: {
          boxShadow: "none",
          "&:hover": { boxShadow: "none", filter: "brightness(1.1)" },
        },
        outlined: {
          borderColor: tokens.colors.borderDark,
          "&:hover": {
            borderColor: tokens.colors.accentLight,
            backgroundColor: alpha(tokens.colors.accentLight, 0.08),
          },
        },
      },
    },

    MuiTextField: {
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-root": {
            borderRadius: tokens.radii.md,
            "& fieldset": { borderColor: tokens.colors.borderDark },
            "&:hover fieldset": { borderColor: "#3d3650" },
            "&.Mui-focused fieldset": {
              borderColor: tokens.colors.accentLight,
              borderWidth: "1.5px",
            },
          },
        },
      },
    },

    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 600,
          fontSize: "0.75rem",
          borderRadius: tokens.radii.pill,
          border: `1px solid ${tokens.colors.borderDark}`,
        },
        colorPrimary: {
          backgroundColor: alpha(tokens.colors.accentLight, 0.12),
          color: tokens.colors.accentLight,
          borderColor: alpha(tokens.colors.accentLight, 0.3),
        },
      },
    },

    MuiPaper: {
      styleOverrides: {
        root: { backgroundImage: "none" },
        outlined: { borderColor: tokens.colors.borderDark },
      },
    },

    MuiTableHead: {
      styleOverrides: {
        root: {
          "& .MuiTableCell-head": {
            fontWeight: 700,
            fontSize: "0.75rem",
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            color: tokens.colors.textSecondaryDark,
            backgroundColor: tokens.colors.bgDark,
            borderBottom: `1px solid ${tokens.colors.borderDark}`,
          },
        },
      },
    },

    MuiTableRow: {
      styleOverrides: {
        root: {
          "&:last-child td": { borderBottom: 0 },
          "& .MuiTableCell-body": { borderColor: tokens.colors.borderDark },
        },
      },
    },

    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: tokens.radii.md,
          "&.Mui-selected": {
            backgroundColor: alpha(tokens.colors.accentLight, 0.1),
            color: tokens.colors.accentLight,
            "& .MuiListItemIcon-root": { color: tokens.colors.accentLight },
          },
        },
      },
    },

    MuiBottomNavigation: {
      styleOverrides: {
        root: {
          height: tokens.bottomNav.height,
          borderTop: `1px solid ${tokens.colors.borderDark}`,
          backgroundColor: alpha(tokens.colors.surfaceDark, 0.9),
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
        },
      },
    },

    MuiBottomNavigationAction: {
      styleOverrides: {
        root: {
          "&.Mui-selected": { color: tokens.colors.accentLight },
        },
      },
    },

    MuiDrawer: {
      styleOverrides: {
        paper: {
          borderRight: `1px solid ${tokens.colors.borderDark}`,
          boxShadow: "none",
          backgroundColor: tokens.colors.surfaceDark,
        },
      },
    },

    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: alpha(tokens.colors.surfaceDark, 0.85),
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          boxShadow: `0 1px 0 ${tokens.colors.borderDark}`,
        },
      },
    },

    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: tokens.radii.xl,
          border: `1px solid ${tokens.colors.borderDark}`,
          backgroundImage: "none",
        },
      },
    },

    MuiFab: {
      styleOverrides: {
        root: {
          boxShadow: tokens.shadows.fab,
          "&:hover": { transform: "translateY(-2px)", filter: "brightness(1.1)" },
          transition: "all 0.2s ease",
        },
      },
    },

    MuiLinearProgress: {
      styleOverrides: {
        root: {
          borderRadius: 999,
          height: 6,
          backgroundColor: tokens.colors.borderDark,
        },
      },
    },

    MuiDivider: {
      styleOverrides: {
        root: { borderColor: tokens.colors.borderDark },
      },
    },

    MuiToggleButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
          fontWeight: 600,
          fontSize: "0.8125rem",
          borderRadius: `${tokens.radii.md} !important`,
          border: `1px solid ${tokens.colors.borderDark}`,
          "&.Mui-selected": {
            backgroundColor: alpha(tokens.colors.accentLight, 0.1),
            color: tokens.colors.accentLight,
            borderColor: alpha(tokens.colors.accentLight, 0.3),
          },
        },
      },
    },
  },
});
