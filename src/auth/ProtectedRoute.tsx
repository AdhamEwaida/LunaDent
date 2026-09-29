import { Navigate, useLocation } from "react-router-dom";
import type { AppRole } from "@/clinic/types";
import { useAuth } from "./AuthContext";

export default function ProtectedRoute({ children, roles }: { children: React.ReactNode; roles?: AppRole[] }) {
  const { user, role, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="min-h-screen grid place-items-center" style={{ background: "var(--background)", color: "var(--muted-foreground)" }}>Loading secure workspace...</div>;
  }
  if (!user) return <Navigate to="/staff/login" replace state={{ from: location.pathname }} />;
  if (roles && (!role || !roles.includes(role))) return <Navigate to="/" replace />;
  return <>{children}</>;
}
