import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/auth/AuthContext";

export default function SuperAdminRoute({ children }: { children: React.ReactNode }) {
  const { user, isSuperAdmin, loading, accountActive } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="min-h-screen grid place-items-center" style={{ background:"var(--background)", color:"var(--muted-foreground)" }}>Loading platform...</div>;
  }

  if (!user) return <Navigate to="/staff/login" replace state={{ from: location.pathname }} />;
  if (!accountActive || !isSuperAdmin) return <Navigate to="/" replace />;
  return <>{children}</>;
}
