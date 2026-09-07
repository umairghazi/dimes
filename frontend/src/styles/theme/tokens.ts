export const tokens = {
  colors: {
    // Accent - finance orange
    accent: "#ff5a1f",
    accentDark: "#d83b0c",
    accentLight: "#ff875c",
    accentBg: "rgba(255, 90, 31, 0.1)",
    accentBorder: "rgba(255, 90, 31, 0.32)",

    // Semantic
    success: "#0b8f5a",
    successBg: "rgba(11, 143, 90, 0.1)",
    warning: "#c98700",
    warningBg: "rgba(201, 135, 0, 0.12)",
    error: "#d33a2c",
    errorBg: "rgba(211, 58, 44, 0.1)",
    info: "#1c75d8",

    // Budget progress
    budgetGreen: "#16a34a",
    budgetAmber: "#d97706",
    budgetRed: "#dc2626",

    // Light mode
    bgLight: "#f6f3ee",
    surfaceLight: "#ffffff",
    surfaceMutedLight: "#f0ebe3",
    borderLight: "#ded7cc",
    textPrimaryLight: "#12100d",
    textSecondaryLight: "#625b52",

    // Dark mode
    bgDark: "#0f1115",
    surfaceDark: "#171a20",
    surfaceMutedDark: "#20242c",
    borderDark: "#2b303a",
    textPrimaryDark: "#f7f2ea",
    textSecondaryDark: "#a7a096",
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
    xs: "0 1px 1px rgba(18,16,13,0.04)",
    sm: "0 12px 30px rgba(18,16,13,0.06)",
    md: "0 18px 50px rgba(18,16,13,0.08)",
    lg: "0 24px 70px rgba(18,16,13,0.1)",
    xl: "0 32px 90px rgba(18,16,13,0.12)",
    card: "0 18px 50px rgba(18,16,13,0.07)",
    cardHover: "0 24px 70px rgba(18,16,13,0.1)",
    fab: "rgba(255,90,31,0.32) 0 12px 28px -8px",
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
