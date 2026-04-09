import { useColorScheme } from "react-native";
import { tokens } from "./tokens";

export function useTheme() {
  const scheme = useColorScheme();
  const dark = scheme === "dark";

  return {
    dark,
    shadow: dark ? tokens.shadow.cardDark : tokens.shadow.card,
    colors: {
      bg: dark ? tokens.colors.bgDark : tokens.colors.bgLight,
      surface: dark ? tokens.colors.surfaceDark : tokens.colors.surfaceLight,
      border: dark ? tokens.colors.borderDark : tokens.colors.borderLight,
      textPrimary: dark ? tokens.colors.textPrimaryDark : tokens.colors.textPrimaryLight,
      textSecondary: dark ? tokens.colors.textSecondaryDark : tokens.colors.textSecondaryLight,
      accent: tokens.colors.accent,
      accentLight: tokens.colors.accentLight,
      accentBg: tokens.colors.accentBg,
      accentBorder: tokens.colors.accentBorder,
      success: tokens.colors.success,
      successBg: tokens.colors.successBg,
      error: tokens.colors.error,
      errorBg: tokens.colors.errorBg,
      warning: tokens.colors.warning,
      warningBg: tokens.colors.warningBg,
      budgetGreen: tokens.colors.budgetGreen,
      budgetAmber: tokens.colors.budgetAmber,
      budgetRed: tokens.colors.budgetRed,
    },
  };
}
