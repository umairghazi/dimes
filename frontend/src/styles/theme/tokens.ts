export const tokens = {
  colors: {
    // Accent — violet
    accent: "#7c3aed",
    accentDark: "#6d28d9",
    accentLight: "#8b5cf6",
    accentBg: "rgba(124, 58, 237, 0.08)",
    accentBorder: "rgba(124, 58, 237, 0.3)",

    // Semantic
    success: "#16a34a",
    successBg: "rgba(22, 163, 74, 0.08)",
    warning: "#d97706",
    warningBg: "rgba(217, 119, 6, 0.08)",
    error: "#dc2626",
    errorBg: "rgba(220, 38, 38, 0.08)",
    info: "#0284c7",

    // Budget progress
    budgetGreen: "#16a34a",
    budgetAmber: "#d97706",
    budgetRed: "#dc2626",

    // Light mode
    bgLight: "#f9f8fc",
    surfaceLight: "#ffffff",
    borderLight: "#e5e4e7",
    textPrimaryLight: "#08060d",
    textSecondaryLight: "#6b6375",

    // Dark mode
    bgDark: "#0c0a10",
    surfaceDark: "#17141f",
    borderDark: "#2a2533",
    textPrimaryDark: "#f5f3ff",
    textSecondaryDark: "#8b84a0",
  },

  font: {
    sans: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
    mono: "ui-monospace, 'SF Mono', Consolas, monospace",
  },

  radii: {
    sm: "6px",
    md: "10px",
    lg: "14px",
    xl: "20px",
    pill: "999px",
  },

  shadows: {
    xs: "0 1px 2px rgba(0,0,0,0.05)",
    sm: "0 1px 3px rgba(0,0,0,0.07), 0 1px 2px rgba(0,0,0,0.04)",
    md: "rgba(0,0,0,0.08) 0 4px 6px -1px, rgba(0,0,0,0.04) 0 2px 4px -1px",
    lg: "rgba(0,0,0,0.10) 0 10px 15px -3px, rgba(0,0,0,0.05) 0 4px 6px -2px",
    xl: "rgba(0,0,0,0.12) 0 20px 25px -5px, rgba(0,0,0,0.06) 0 10px 10px -5px",
    card: "0 0 0 1px rgba(0,0,0,0.05), rgba(0,0,0,0.06) 0 4px 6px -1px",
    cardHover: "0 0 0 1px rgba(0,0,0,0.08), rgba(0,0,0,0.10) 0 10px 15px -3px, rgba(0,0,0,0.05) 0 4px 6px -2px",
    fab: "rgba(124,58,237,0.35) 0 8px 16px -2px",
    bottomSheet: "0 -4px 20px rgba(0,0,0,0.10)",
  },

  sidebar: {
    width: 240,
    railWidth: 68,
  },
  bottomNav: {
    height: 60,
  },
  topBar: {
    height: 60,
  },
} as const;
