import { tokens } from "./tokens";

export const typography = {
  fontFamily: tokens.font.sans,
  h1: { fontSize: "3rem", fontWeight: 850, lineHeight: 1.05, letterSpacing: "0" },
  h2: { fontSize: "2.35rem", fontWeight: 850, lineHeight: 1.1, letterSpacing: "0" },
  h3: { fontSize: "1.9rem", fontWeight: 800, lineHeight: 1.16, letterSpacing: "0" },
  h4: { fontSize: "1.55rem", fontWeight: 800, lineHeight: 1.2, letterSpacing: "0" },
  h5: { fontSize: "1.15rem", fontWeight: 780, lineHeight: 1.25, letterSpacing: "0" },
  h6: { fontSize: "1rem", fontWeight: 760, lineHeight: 1.35, letterSpacing: "0" },
  body1: { fontSize: "0.9375rem", fontWeight: 420, lineHeight: 1.6, letterSpacing: "0" },
  body2: { fontSize: "0.875rem", fontWeight: 420, lineHeight: 1.55, letterSpacing: "0" },
  caption: { fontSize: "0.75rem", fontWeight: 620, lineHeight: 1.45, letterSpacing: "0" },
  overline: {
    fontSize: "0.6875rem",
    fontWeight: 700,
    lineHeight: 2,
    letterSpacing: "0",
    textTransform: "uppercase" as const,
  },
  button: {
    fontSize: "0.875rem",
    fontWeight: 600,
    letterSpacing: "0",
    textTransform: "none" as const,
  },
} as const;
