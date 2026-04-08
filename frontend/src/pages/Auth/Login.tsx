import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Box, TextField, Button, Typography, Alert } from "@mui/material";
import { authApi } from "@/api/auth.api";
import { useAuthStore } from "@/store/authStore";
import { tokens } from "@/styles/theme/tokens";

export function Login() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const result = await authApi.login(email, password);
      setAuth(result.user, result.accessToken);
      navigate("/");
    } catch {
      setError("Invalid email or password");
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
          background: `linear-gradient(135deg, ${tokens.colors.accentDark} 0%, ${tokens.colors.accentLight} 100%)`,
          color: "#fff",
        }}
      >
        <Typography variant="h5" sx={{ fontWeight: 800, letterSpacing: "-0.02em" }}>
          Dimes
        </Typography>
        <Box>
          <Typography variant="h2" sx={{ fontWeight: 800, mb: 2, lineHeight: 1.1 }}>
            Take control of your finances.
          </Typography>
          <Typography sx={{ opacity: 0.8, fontSize: "1.0625rem", lineHeight: 1.7 }}>
            Track expenses, set budgets, and get AI-powered insights - all in one place.
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
        <Typography variant="h5" color="primary" sx={{ fontWeight: 800, mb: 6, display: { md: "none" } }}>
          Dimes
        </Typography>

        <Typography variant="h4" sx={{ fontWeight: 800, mb: 0.5 }}>
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
