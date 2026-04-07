import { ThemeProvider, CssBaseline } from "@mui/material";
import { useThemeStore } from "@/store/themeStore";
import { lightTheme } from "@/styles/theme/lightTheme";
import { darkTheme } from "@/styles/theme/darkTheme";
import { AppRouter } from "@/router/AppRouter";

export default function App() {
  const { mode } = useThemeStore();
  const theme = mode === "dark" ? darkTheme : lightTheme;

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppRouter />
    </ThemeProvider>
  );
}
