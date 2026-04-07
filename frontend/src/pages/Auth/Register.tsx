import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Box, TextField, Button, Typography, Alert } from "@mui/material";
import { authApi } from "@/api/auth.api";
import { useAuthStore } from "@/store/authStore";
import { tokens } from "@/styles/theme/tokens";

export function Register() {
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
      const result = await authApi.register(email, password);
      setAuth(result.user, result.accessToken);
      navigate("/");
    } catch {
      setError("Registration failed. Email may already be in use.");
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
        <Typography variant="h5" fontWeight={800} letterSpacing="-0.02em">
          Dimes
        </Typography>
        <Box>
          <Typography variant="h2" fontWeight={800} mb={2} sx={{ lineHeight: 1.1 }}>
            Your finances, finally under control.
          </Typography>
          <Typography sx={{ opacity: 0.8, fontSize: "1.0625rem", lineHeight: 1.7 }}>
            Join thousands tracking smarter with AI-powered categorization and real-time budget alerts.
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
        <Typography variant="h5" fontWeight={800} color="primary" mb={6} sx={{ display: { md: "none" } }}>
          Dimes
        </Typography>

        <Typography variant="h4" fontWeight={800} mb={0.5}>
          Create your account
        </Typography>
        <Typography color="text.secondary" mb={4} sx={{ fontSize: "0.9375rem" }}>
          Free to start. No credit card required.
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

        <Box
          component="form"
          onSubmit={(e) => void handleSubmit(e)}
          sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}
        >
          <TextField label="Email address" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required fullWidth autoComplete="email" autoFocus />
          <TextField
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            fullWidth
            inputProps={{ minLength: 8 }}
            helperText="At least 8 characters"
            autoComplete="new-password"
          />
          <Button type="submit" variant="contained" size="large" disabled={loading} fullWidth sx={{ mt: 0.5, py: 1.5, fontSize: "0.9375rem" }}>
            {loading ? "Creating account…" : "Get started"}
          </Button>
        </Box>

        <Typography variant="body2" color="text.secondary" textAlign="center" mt={4}>
          Already have an account?{" "}
          <Link to="/login" style={{ color: tokens.colors.accent, fontWeight: 600, textDecoration: "none" }}>
            Sign in
          </Link>
        </Typography>
      </Box>
    </Box>
  );
}
