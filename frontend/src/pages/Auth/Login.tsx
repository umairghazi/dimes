import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Box, TextField, Button, Typography, Alert } from "@mui/material";
import { supabase } from "@/lib/supabase/client";
import { useAuthStore } from "@/store/authStore";
import { tokens } from "@/styles/theme/tokens";

export function Login() {
  const navigate = useNavigate();
  const setSession = useAuthStore((s) => s.setSession);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) throw signInError;
      setSession(data.session);
      navigate("/");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Invalid email or password";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "grid",
        gridTemplateColumns: { md: "1fr 1fr" },
        bgcolor: "background.default",
      }}
    >
      {/* Left branding panel */}
      <Box
        sx={{
          display: { xs: "none", md: "flex" },
          flexDirection: "column",
          justifyContent: "space-between",
          p: 6,
          background: "#12100d",
          color: "#f7f2ea",
        }}
      >
        <Typography variant="h5" sx={{ fontWeight: 850, letterSpacing: 0, color: tokens.colors.accent }}>
          Dimes
        </Typography>
        <Box>
          <Typography variant="h1" sx={{ fontWeight: 850, mb: 2, lineHeight: 1.05 }}>
            Take control of your finances.
          </Typography>
          <Typography sx={{ opacity: 0.8, fontSize: "1.0625rem", lineHeight: 1.7 }}>
            Track expenses and monthly plans with a simpler spreadsheet-style workflow.
          </Typography>
        </Box>
        <Typography variant="caption" sx={{ opacity: 0.5 }}>
          © {new Date().getFullYear()} Dimes
        </Typography>
      </Box>

      {/* Right form panel */}
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          px: { xs: 3, sm: 6, lg: 10 },
          py: 8,
          maxWidth: { xs: "100%", md: 480 },
          width: "100%",
          mx: "auto",
        }}
      >
        <Typography variant="h5" color="primary" sx={{ fontWeight: 850, mb: 6, display: { md: "none" } }}>
          Dimes
        </Typography>

        <Typography variant="h3" sx={{ fontWeight: 850, mb: 0.5 }}>
          Welcome back
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 4, fontSize: "0.9375rem" }}>
          Sign in to your account to continue.
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

        <Box
          component="form"
          onSubmit={(e) => void handleSubmit(e)}
          sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}
        >
          <TextField label="Email address" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required fullWidth autoComplete="email" autoFocus />
          <TextField label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required fullWidth autoComplete="current-password" />
          <Button type="submit" variant="contained" size="large" disabled={loading} fullWidth sx={{ mt: 0.5, py: 1.5, fontSize: "0.9375rem" }}>
            {loading ? "Signing in…" : "Sign in"}
          </Button>
        </Box>

        <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center", mt: 4 }}>
          Don't have an account?{" "}
          <Link to="/register" style={{ color: tokens.colors.accent, fontWeight: 600, textDecoration: "none" }}>
            Create one
          </Link>
        </Typography>
      </Box>
    </Box>
  );
}
