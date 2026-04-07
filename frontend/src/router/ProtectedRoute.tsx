import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import { authApi } from "@/api/auth.api";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, accessToken, setAccessToken, clearAuth } = useAuthStore();
  const [initializing, setInitializing] = useState(!accessToken && !!user);

  useEffect(() => {
    // User data restored from localStorage but access token is gone (page reload).
    // Try to get a fresh access token using the httpOnly refresh cookie.
    if (user && !accessToken) {
      authApi
        .refresh()
        .then(({ accessToken: newToken }) => setAccessToken(newToken))
        .catch(() => clearAuth())
        .finally(() => setInitializing(false));
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (initializing) return null;
  if (!user || !accessToken) return <Navigate to="/login" replace />;
  return <>{children}</>;
}
