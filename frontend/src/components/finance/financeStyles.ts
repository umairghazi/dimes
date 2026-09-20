import { SxProps, Theme } from "@mui/material/styles";

export const financeSurfaces = {
  panel: {
    borderRadius: 1,
    borderColor: "rgba(255,255,255,0.08)",
    bgcolor: "rgba(32,35,45,0.92)",
    boxShadow: "0 20px 60px rgba(0,0,0,0.28)",
  },
  panelMuted: {
    borderRadius: 1,
    borderColor: "rgba(255,255,255,0.08)",
    bgcolor: "rgba(32,35,45,0.94)",
  },
  hero: {
    borderRadius: 1,
    borderColor: "rgba(255,255,255,0.08)",
    bgcolor: "#171a23",
    backgroundImage: "linear-gradient(135deg, rgba(88,101,242,0.16), rgba(255,107,44,0.12) 44%, rgba(255,255,255,0.03))",
  },
  toolbar: {
    display: "flex",
    alignItems: "center",
    gap: 0.5,
    px: 1,
    py: 0.5,
    border: "1px solid",
    borderColor: "rgba(255,255,255,0.1)",
    borderRadius: 1,
    bgcolor: "rgba(15,17,23,0.48)",
  },
} satisfies Record<string, SxProps<Theme>>;

