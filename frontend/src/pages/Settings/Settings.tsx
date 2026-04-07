import {
  Box,
  Typography,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  Switch,
  Button,
  ToggleButtonGroup,
  ToggleButton,
} from "@mui/material";
import { useThemeStore } from "@/store/themeStore";
import { useAuthStore } from "@/store/authStore";
import { usePreferencesStore, CURRENCIES } from "@/store/preferencesStore";
import { authApi } from "@/api/auth.api";
import { useNavigate } from "react-router-dom";
import { CategoryManager } from "@/components/settings/CategoryManager";

export function Settings() {
  const { mode, toggleTheme } = useThemeStore();
  const { user, clearAuth } = useAuthStore();
  const { currency, setCurrency } = usePreferencesStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await authApi.logout();
    clearAuth();
    navigate("/login");
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 600, mx: "auto" }}>
      <Typography variant="h4" fontWeight={700} mb={3}>Settings</Typography>

      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="h6" fontWeight={600} mb={1}>Account</Typography>
          <Typography variant="body2" color="text.secondary">{user?.email}</Typography>
        </CardContent>
      </Card>

      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="h6" fontWeight={600} mb={1}>Appearance</Typography>
          <List disablePadding>
            <ListItem
              secondaryAction={
                <Switch checked={mode === "dark"} onChange={toggleTheme} />
              }
            >
              <ListItemText primary="Dark Mode" />
            </ListItem>
          </List>
        </CardContent>
      </Card>

      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="h6" fontWeight={600} mb={2}>Currency</Typography>
          <ToggleButtonGroup
            value={currency}
            exclusive
            onChange={(_, val) => { if (val) setCurrency(val); }}
            size="small"
          >
            {CURRENCIES.map((c) => (
              <ToggleButton key={c} value={c} sx={{ px: 2 }}>{c}</ToggleButton>
            ))}
          </ToggleButtonGroup>
        </CardContent>
      </Card>

      <Card sx={{ mb: 2 }}>
        <CardContent>
          <CategoryManager />
        </CardContent>
      </Card>

      <Button
        variant="outlined"
        color="error"
        onClick={() => void handleLogout()}
        fullWidth
      >
        Sign Out
      </Button>
    </Box>
  );
}
