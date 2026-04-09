export const tokens = {
  colors: {
    accent: "#7c3aed",
    accentDark: "#6d28d9",
    accentLight: "#8b5cf6",
    accentBg: "rgba(124, 58, 237, 0.08)",
    accentBorder: "rgba(124, 58, 237, 0.3)",

    success: "#16a34a",
    successBg: "rgba(22, 163, 74, 0.08)",
    warning: "#d97706",
    warningBg: "rgba(217, 119, 6, 0.08)",
    error: "#dc2626",
    errorBg: "rgba(220, 38, 38, 0.08)",
    info: "#0284c7",

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

  radii: {
    sm: 6,
    md: 10,
    lg: 14,
    xl: 20,
    pill: 999,
  },

  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },

  shadow: {
    card: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.06,
      shadowRadius: 4,
      elevation: 2,
    },
    cardDark: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 6,
      elevation: 4,
    },
  },
} as const;
