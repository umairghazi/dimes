export const tokens = {
  colors: {
    // Accent - high contrast finance orange
    accent: "#ff6b2c",
    accentDark: "#e24f12",
    accentLight: "#ff9a64",
    accentBg: "rgba(255, 107, 44, 0.16)",
    accentBorder: "rgba(255, 107, 44, 0.42)",

    // Semantic
    success: "#29cc7a",
    successBg: "rgba(41, 204, 122, 0.14)",
    warning: "#f0b232",
    warningBg: "rgba(240, 178, 50, 0.16)",
    error: "#ff5c6c",
    errorBg: "rgba(255, 92, 108, 0.14)",
    info: "#5865f2",

    // Budget progress
    budgetGreen: "#16a34a",
    budgetAmber: "#d97706",
    budgetRed: "#dc2626",

    // Light mode
    bgLight: "#13151c",
    surfaceLight: "#20232d",
    surfaceMutedLight: "#2a2e3a",
    borderLight: "#383e4d",
    textPrimaryLight: "#f6f7fb",
    textSecondaryLight: "#b9becd",

    // Dark mode
    bgDark: "#0f1117",
    surfaceDark: "#1c1f29",
    surfaceMutedDark: "#262a36",
    borderDark: "#353b4a",
    textPrimaryDark: "#f7f8fc",
    textSecondaryDark: "#b5bbcb",
  },

  font: {
    sans: "Inter, ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
    mono: "ui-monospace, 'SF Mono', Consolas, monospace",
  },

  radii: {
    sm: "6px",
    md: "8px",
    lg: "8px",
    xl: "8px",
    pill: "999px",
  },

  shadows: {
    xs: "0 1px 1px rgba(0,0,0,0.18)",
    sm: "0 14px 32px rgba(0,0,0,0.22)",
    md: "0 20px 52px rgba(0,0,0,0.28)",
    lg: "0 28px 76px rgba(0,0,0,0.34)",
    xl: "0 36px 100px rgba(0,0,0,0.42)",
    card: "0 20px 52px rgba(0,0,0,0.28)",
    cardHover: "0 28px 76px rgba(0,0,0,0.36)",
    fab: "rgba(255,107,44,0.38) 0 12px 28px -8px",
    bottomSheet: "0 -4px 20px rgba(0,0,0,0.10)",
  },

  sidebar: {
    width: 248,
    railWidth: 68,
  },
  bottomNav: {
    height: 60,
  },
  topBar: {
    height: 60,
  },
} as const;
