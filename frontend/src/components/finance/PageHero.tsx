import { Box, Paper, Typography } from "@mui/material";
import { ReactNode } from "react";
import { financeSurfaces } from "./financeStyles";

interface PageHeroProps {
  eyebrow: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  variant?: "default" | "warm";
}

export function PageHero({ eyebrow, title, description, actions, variant = "default" }: PageHeroProps) {
  return (
    <Paper
      variant="outlined"
      sx={{
        ...financeSurfaces.hero,
        p: { xs: 2, md: 3 },
        mb: 2,
        backgroundImage: variant === "warm"
          ? "linear-gradient(135deg, rgba(255,107,44,0.16), rgba(88,101,242,0.12) 46%, rgba(255,255,255,0.03))"
          : financeSurfaces.hero.backgroundImage,
      }}
    >
      <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 2, flexWrap: "wrap" }}>
        <Box>
          <Typography variant="overline" color="primary.main" sx={{ fontWeight: 900 }}>
            {eyebrow}
          </Typography>
          <Typography variant="h1" sx={{ fontWeight: 900 }}>
            {title}
          </Typography>
          {description && (
            <Typography variant="body1" color="text.secondary" sx={{ mt: 1, maxWidth: 720 }}>
              {description}
            </Typography>
          )}
        </Box>
        {actions}
      </Box>
    </Paper>
  );
}

