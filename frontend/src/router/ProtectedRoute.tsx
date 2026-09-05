import { useEffect } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/lib/supabase/client";
import { useAuthStore } from "@/store/authStore";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, initialized, setSession, setInitialized } = useAuthStore();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setInitialized(true);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setInitialized(true);
    });

    return () => listener.subscription.unsubscribe();
  }, [setInitialized, setSession]);

  if (!initialized) return null;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}
