import { useEffect, useState } from "react";
import { LinearProgress } from "@mui/material";
import { useLocation } from "react-router-dom";
import { useIsFetching, useIsMutating } from "@tanstack/react-query";
import { useActivityStore } from "@/store/activityStore";

export function AppProgress() {
  const location = useLocation();
  const pending = useActivityStore((state) => state.pending);
  const fetching = useIsFetching();
  const mutating = useIsMutating();
  const [transitioning, setTransitioning] = useState(false);

  useEffect(() => {
    setTransitioning(true);
    const timer = window.setTimeout(() => setTransitioning(false), 250);
    return () => window.clearTimeout(timer);
  }, [location.key]);

  const busy = pending > 0 || fetching > 0 || mutating > 0 || transitioning;
  return busy ? <LinearProgress aria-label="Loading" sx={{
    position: "fixed", top: 0, left: 0, right: 0, height: 3,
    zIndex: (theme) => theme.zIndex.tooltip + 1,
    bgcolor: "transparent", pointerEvents: "none",
    "& .MuiLinearProgress-bar": { bgcolor: "primary.main" },
    "@media (prefers-reduced-motion: reduce)": { "& .MuiLinearProgress-bar": { animation: "none", transform: "none" } },
  }} /> : null;
}
