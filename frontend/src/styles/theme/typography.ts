import { tokens } from "./tokens";

export const typography = {
  fontFamily: tokens.font.sans,
  h1: { fontSize: "2.75rem", fontWeight: 800, lineHeight: 1.15, letterSpacing: "-0.03em" },
  h2: { fontSize: "2.25rem", fontWeight: 800, lineHeight: 1.2, letterSpacing: "-0.025em" },
  h3: { fontSize: "1.875rem", fontWeight: 700, lineHeight: 1.25, letterSpacing: "-0.02em" },
  h4: { fontSize: "1.5rem", fontWeight: 700, lineHeight: 1.3, letterSpacing: "-0.015em" },
  h5: { fontSize: "1.25rem", fontWeight: 700, lineHeight: 1.4, letterSpacing: "-0.01em" },
  h6: { fontSize: "1.0625rem", fontWeight: 700, lineHeight: 1.5, letterSpacing: "-0.005em" },
  body1: { fontSize: "0.9375rem", fontWeight: 400, lineHeight: 1.65, letterSpacing: "0.01em" },
  body2: { fontSize: "0.875rem", fontWeight: 400, lineHeight: 1.6, letterSpacing: "0.01em" },
  caption: { fontSize: "0.75rem", fontWeight: 500, lineHeight: 1.5, letterSpacing: "0.02em" },
  overline: {
    fontSize: "0.6875rem",
    fontWeight: 700,
    lineHeight: 2,
    letterSpacing: "0.1em",
    textTransform: "uppercase" as const,
  },
  button: {
    fontSize: "0.875rem",
    fontWeight: 600,
    letterSpacing: "0.01em",
    textTransform: "none" as const,
  },
} as const;
