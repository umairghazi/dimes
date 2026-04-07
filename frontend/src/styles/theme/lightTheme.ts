import { createTheme, alpha } from "@mui/material/styles";
import { tokens } from "./tokens";
import { typography } from "./typography";

export const lightTheme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: tokens.colors.accent,
      dark: tokens.colors.accentDark,
      light: tokens.colors.accentLight,
      contrastText: "#ffffff",
    },
    secondary: { main: "#0284c7" },
    success: { main: tokens.colors.success },
    warning: { main: tokens.colors.warning },
    error: { main: tokens.colors.error },
    info: { main: tokens.colors.info },
    background: {
      default: tokens.colors.bgLight,
      paper: tokens.colors.surfaceLight,
    },
    text: {
      primary: tokens.colors.textPrimaryLight,
      secondary: tokens.colors.textSecondaryLight,
    },
    divider: tokens.colors.borderLight,
  },

  typography: {
    ...typography,
  },

  shape: { borderRadius: 10 },

  shadows: [
    "none",
    tokens.shadows.xs,
    tokens.shadows.sm,
    tokens.shadows.md,
    tokens.shadows.lg,
    tokens.shadows.xl,
    tokens.shadows.xl,
    tokens.shadows.xl,
    tokens.shadows.xl,
    tokens.shadows.xl,
    tokens.shadows.xl,
    tokens.shadows.xl,
    tokens.shadows.xl,
    tokens.shadows.xl,
    tokens.shadows.xl,
    tokens.shadows.xl,
    tokens.shadows.xl,
    tokens.shadows.xl,
    tokens.shadows.xl,
    tokens.shadows.xl,
    tokens.shadows.xl,
    tokens.shadows.xl,
    tokens.shadows.xl,
    tokens.shadows.xl,
    tokens.shadows.xl,
  ],

  components: {
    MuiCssBaseline: {
      styleOverrides: {
        "*, *::before, *::after": { boxSizing: "border-box" },
        body: {
          fontFamily: tokens.font.sans,
          WebkitFontSmoothing: "antialiased",
          MozOsxFontSmoothing: "grayscale",
          textRendering: "optimizeLegibility",
          fontSynthesis: "none",
        },
      },
    },

    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: tokens.shadows.card,
          border: `1px solid ${tokens.colors.borderLight}`,
          borderRadius: tokens.radii.lg,
          backgroundImage: "none",
          transition: "box-shadow 0.2s ease, transform 0.2s ease",
          "&:hover": {
            boxShadow: tokens.shadows.cardHover,
          },
        },
      },
    },

    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
          fontWeight: 600,
          letterSpacing: "0.01em",
          borderRadius: tokens.radii.md,
          transition: "all 0.15s ease",
        },
        contained: {
          boxShadow: "none",
          "&:hover": {
            boxShadow: tokens.shadows.md,
            transform: "translateY(-1px)",
          },
          "&:active": {
            transform: "translateY(0)",
            boxShadow: "none",
          },
        },
        outlined: {
          borderColor: tokens.colors.borderLight,
          "&:hover": {
            borderColor: tokens.colors.accent,
            backgroundColor: tokens.colors.accentBg,
          },
        },
        sizeLarge: {
          padding: "10px 24px",
          fontSize: "0.9375rem",
        },
      },
    },

    MuiTextField: {
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-root": {
            borderRadius: tokens.radii.md,
            fontSize: "0.9375rem",
            "& fieldset": {
              borderColor: tokens.colors.borderLight,
              transition: "border-color 0.15s ease",
            },
            "&:hover fieldset": {
              borderColor: "#c4c0cc",
            },
            "&.Mui-focused fieldset": {
              borderColor: tokens.colors.accent,
              borderWidth: "1.5px",
            },
          },
          "& .MuiInputLabel-root.Mui-focused": {
            color: tokens.colors.accent,
          },
        },
      },
    },

    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 600,
          fontSize: "0.75rem",
          letterSpacing: "0.01em",
          borderRadius: tokens.radii.pill,
          border: `1px solid ${tokens.colors.borderLight}`,
        },
        colorPrimary: {
          backgroundColor: tokens.colors.accentBg,
          color: tokens.colors.accent,
          borderColor: tokens.colors.accentBorder,
        },
        colorSuccess: {
          backgroundColor: tokens.colors.successBg,
          color: tokens.colors.success,
          borderColor: "rgba(22, 163, 74, 0.3)",
        },
        colorError: {
          backgroundColor: tokens.colors.errorBg,
          color: tokens.colors.error,
          borderColor: "rgba(220, 38, 38, 0.3)",
        },
        colorWarning: {
          backgroundColor: tokens.colors.warningBg,
          color: tokens.colors.warning,
          borderColor: "rgba(217, 119, 6, 0.3)",
        },
      },
    },

    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
        },
        outlined: {
          borderColor: tokens.colors.borderLight,
        },
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
            color: tokens.colors.textSecondaryLight,
            backgroundColor: tokens.colors.bgLight,
            borderBottom: `1px solid ${tokens.colors.borderLight}`,
          },
        },
      },
    },

    MuiTableRow: {
      styleOverrides: {
        root: {
          "&:last-child td": { borderBottom: 0 },
          "& .MuiTableCell-body": {
            borderColor: tokens.colors.borderLight,
          },
        },
      },
    },

    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: tokens.radii.md,
          transition: "all 0.15s ease",
          "&.Mui-selected": {
            backgroundColor: tokens.colors.accentBg,
            color: tokens.colors.accent,
            "& .MuiListItemIcon-root": { color: tokens.colors.accent },
            "&:hover": { backgroundColor: alpha(tokens.colors.accent, 0.12) },
          },
        },
      },
    },

    MuiBottomNavigation: {
      styleOverrides: {
        root: {
          height: tokens.bottomNav.height,
          borderTop: `1px solid ${tokens.colors.borderLight}`,
          backgroundColor: alpha(tokens.colors.surfaceLight, 0.9),
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
        },
      },
    },

    MuiBottomNavigationAction: {
      styleOverrides: {
        root: {
          "&.Mui-selected": { color: tokens.colors.accent },
        },
      },
    },

    MuiDrawer: {
      styleOverrides: {
        paper: {
          borderRight: `1px solid ${tokens.colors.borderLight}`,
          boxShadow: "none",
        },
      },
    },

    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: alpha(tokens.colors.surfaceLight, 0.85),
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          boxShadow: `0 1px 0 ${tokens.colors.borderLight}`,
        },
      },
    },

    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: tokens.radii.md,
          border: "1px solid",
          fontSize: "0.875rem",
        },
      },
    },

    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: tokens.radii.xl,
          boxShadow: tokens.shadows.xl,
          border: `1px solid ${tokens.colors.borderLight}`,
        },
      },
    },

    MuiFab: {
      styleOverrides: {
        root: {
          boxShadow: tokens.shadows.fab,
          "&:hover": {
            boxShadow: tokens.shadows.lg,
            transform: "translateY(-2px)",
          },
          transition: "all 0.2s ease",
        },
      },
    },

    MuiStepper: {
      styleOverrides: {
        root: { padding: 0 },
      },
    },

    MuiSelect: {
      styleOverrides: {
        outlined: {
          borderRadius: tokens.radii.md,
        },
      },
    },

    MuiToggleButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
          fontWeight: 600,
          fontSize: "0.8125rem",
          borderRadius: `${tokens.radii.md} !important`,
          border: `1px solid ${tokens.colors.borderLight}`,
          "&.Mui-selected": {
            backgroundColor: tokens.colors.accentBg,
            color: tokens.colors.accent,
            borderColor: tokens.colors.accentBorder,
          },
        },
      },
    },

    MuiLinearProgress: {
      styleOverrides: {
        root: {
          borderRadius: 999,
          height: 6,
          backgroundColor: tokens.colors.borderLight,
        },
      },
    },

    MuiDivider: {
      styleOverrides: {
        root: { borderColor: tokens.colors.borderLight },
      },
    },

    MuiSkeleton: {
      styleOverrides: {
        root: { borderRadius: tokens.radii.md },
      },
    },
  },
});
