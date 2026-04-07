import { useTheme, useMediaQuery } from "@mui/material";

export function useBreakpoint() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isTablet = useMediaQuery(theme.breakpoints.between("sm", "md"));
  const isDesktop = useMediaQuery(theme.breakpoints.up("md"));

  return { isMobile, isTablet, isDesktop };
}
