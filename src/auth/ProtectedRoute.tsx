import { Link, Navigate, useLocation } from "react-router-dom";
import { LockKeyhole } from "lucide-react";
import type { AppRole } from "@/clinic/types";
import { useAuth } from "./AuthContext";

const FEATURE_LABELS: Record<string, string> = {
  accounting: "Accounting",
  inventory: "Inventory",
  website: "Website Builder",
  custom_domain: "Custom domains",
  patient_portal: "Patient Portal",
};

export default function ProtectedRoute({
  children,
  roles,
  requiredFeature,
}: {
  children: React.ReactNode;
  roles?: AppRole[];
  requiredFeature?: string;
}) {
  const {
    user,
    role,
    loading,
    accountActive,
    mustChangePassword,
    activeClinic,
    activeClinicRole,
    entitlements,
    entitlementsLoading,
    hasFeature,
  } = useAuth();
  const location = useLocation();

  if (loading || (requiredFeature && entitlementsLoading)) {
    return (
      <div className="min-h-screen grid place-items-center bg-slate-50 text-slate-500">
        <div className="text-center">
          <div className="mx-auto h-9 w-9 animate-spin rounded-full border-2 border-slate-200 border-t-slate-900" />
          <p className="mt-4 text-sm font-medium">Loading secure workspace…</p>
        </div>
      </div>
    );
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

  if (requiredFeature && !hasFeature(requiredFeature)) {
    const featureName = FEATURE_LABELS[requiredFeature] || requiredFeature.replaceAll("_", " ");
    const inactiveSubscription = Boolean(entitlements && !entitlements.usable);

    return (
      <div className="min-h-screen grid place-items-center bg-slate-50 px-5 text-slate-950">
        <div className="w-full max-w-lg rounded-3xl border bg-white p-8 text-center shadow-sm">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-violet-50 text-violet-700">
            <LockKeyhole size={25} />
          </div>
          <p className="mt-5 text-xs font-semibold uppercase tracking-[0.16em] text-violet-600">
            {inactiveSubscription ? "Subscription action required" : "Plan feature"}
          </p>
          <h1 className="mt-2 text-2xl font-bold">
            {inactiveSubscription ? "Clinic subscription is not active" : featureName + " is not included"}
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-slate-500">
            {inactiveSubscription
              ? "This clinic is currently read-only for plan-protected features. Contact LunaDent to restore access."
              : "The " + (entitlements?.plan?.name || "current") + " plan does not include " + featureName + ". Your clinic data stays unchanged."}
          </p>
          <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
            <Link to="/admin" className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white">
              Back to workspace
            </Link>
            {activeClinicRole === "clinic_owner" && (
              <a href="mailto:sales@lunadent.app" className="rounded-xl border px-5 py-3 text-sm font-semibold">
                Ask about upgrade
              </a>
            )}
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
