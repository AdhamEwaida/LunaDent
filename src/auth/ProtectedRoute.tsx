import { Navigate, useLocation } from "react-router-dom";
import type { AppRole } from "@/clinic/types";
import { useAuth } from "./AuthContext";

export default function ProtectedRoute({ children, roles }: { children: React.ReactNode; roles?: AppRole[] }) {
  const { user, role, loading, accountActive, mustChangePassword, activeClinic, activeClinicRole } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="min-h-screen grid place-items-center" style={{ background: "var(--background)", color: "var(--muted-foreground)" }}>Loading secure workspace...</div>;
  }
  if (!user) return <Navigate to="/staff/login" replace state={{ from: location.pathname }} />;
  if (!accountActive) return <Navigate to="/staff/login" replace />;
  if (mustChangePassword && location.pathname !== "/staff/change-password") {
    return <Navigate to="/staff/change-password" replace state={{ from: location.pathname }} />;
  }
  if (
    activeClinicRole === "clinic_owner"
    && activeClinic
    && activeClinic.onboarding_completed === false
    && location.pathname !== "/onboarding"
  ) {
    return <Navigate to="/onboarding" replace state={{ from: location.pathname }} />;
  }
  if (roles && (!role || !roles.includes(role))) return <Navigate to="/" replace />;
  return <>{children}</>;
}
