import { lazy, Suspense } from "react";
import { BrowserRouter, Link, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "@/auth/AuthContext";
import ProtectedRoute from "@/auth/ProtectedRoute";
import SuperAdminRoute from "@/auth/SuperAdminRoute";
import AppErrorBoundary, { RouteFallback } from "@/components/AppErrorBoundary";

const StaffLogin = lazy(() => import("@/pages/staff/Login"));
const StaffChangePassword = lazy(() => import("@/pages/staff/ChangePassword"));
const PatientPortalLive = lazy(() => import("@/pages/PatientPortalLive"));
const PatientSignup = lazy(() => import("@/pages/patient/Signup").then((module) => ({ default: module.PatientSignup })));
const CompletePatientProfile = lazy(() => import("@/pages/patient/Signup").then((module) => ({ default: module.CompletePatientProfile })));
const AdminDashboardPage = lazy(() => import("@/pages/AdminDashboard"));
const AccountingLive = lazy(() => import("@/pages/AccountingLive"));
const SaasLanding = lazy(() => import("@/pages/SaasLanding"));
const SuperAdmin = lazy(() => import("@/pages/SuperAdmin"));
const ClinicSite = lazy(() => import("@/pages/ClinicSite"));
const ClinicBooking = lazy(() => import("@/pages/ClinicBooking"));
const ClinicOnboarding = lazy(() => import("@/pages/ClinicOnboarding"));

function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-5">
      <div className="w-full max-w-lg rounded-3xl border bg-white p-8 text-center shadow-sm">
        <div className="text-5xl mb-4">🦷</div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-600">404</p>
        <h1 className="text-3xl font-bold mt-2 mb-2">Page not found</h1>
        <p className="text-sm mb-6 text-slate-500">The page may have moved, or the address is incorrect.</p>
        <Link to="/" className="inline-flex px-6 py-3 rounded-xl text-sm font-semibold bg-slate-950 text-white">
          Back to LunaDent
        </Link>
      </div>
    </div>
  );
}

export default function App() {
  const staffRoles = ["admin", "dentist", "receptionist", "accountant"] as const;
  const secureAdmin = (roles: Array<(typeof staffRoles)[number]>) => (
    <ProtectedRoute roles={roles}>
      <AdminDashboardPage />
    </ProtectedRoute>
  );

  const secureAdminFeature = (
    roles: Array<(typeof staffRoles)[number]>,
    requiredFeature: string,
  ) => (
    <ProtectedRoute roles={roles} requiredFeature={requiredFeature}>
      <AdminDashboardPage />
    </ProtectedRoute>
  );

  const accountingElement = (
    <ProtectedRoute roles={["admin", "receptionist", "accountant"]} requiredFeature="accounting">
      <AccountingLive />
    </ProtectedRoute>
  );

  return (
    <AppErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
          <Suspense fallback={<RouteFallback />}>
            <Routes>
              <Route path="/" element={<SaasLanding />} />
              <Route path="/super-admin" element={<SuperAdminRoute><SuperAdmin /></SuperAdminRoute>} />

              <Route path="/c/:clinicSlug" element={<ClinicSite />} />
              <Route path="/c/:clinicSlug/booking" element={<ClinicBooking />} />

              <Route path="/c/:clinicSlug/patient/login" element={<PatientPortalLive />} />
              <Route path="/c/:clinicSlug/patient/signup" element={<PatientSignup />} />
              <Route path="/c/:clinicSlug/patient/complete-profile" element={<CompletePatientProfile />} />
              <Route path="/c/:clinicSlug/patient" element={<PatientPortalLive />} />
              <Route path="/c/:clinicSlug/patient/appointments" element={<PatientPortalLive />} />
              <Route path="/c/:clinicSlug/patient/invoices" element={<PatientPortalLive />} />
              <Route path="/c/:clinicSlug/patient/payments" element={<PatientPortalLive />} />
              <Route path="/c/:clinicSlug/patient/documents" element={<PatientPortalLive />} />

              <Route path="/staff/login" element={<StaffLogin />} />
              <Route path="/staff/change-password" element={
                <ProtectedRoute roles={[...staffRoles]}>
                  <StaffChangePassword />
                </ProtectedRoute>
              } />

              <Route path="/onboarding" element={
                <ProtectedRoute roles={["admin"]}>
                  <ClinicOnboarding />
                </ProtectedRoute>
              } />
              <Route path="/admin" element={secureAdmin([...staffRoles])} />
              <Route path="/admin/patients" element={secureAdminFeature([...staffRoles], "patients")} />
              <Route path="/admin/patients/:patientId" element={secureAdminFeature([...staffRoles], "patients")} />
              <Route path="/admin/appointments" element={secureAdminFeature(["admin", "dentist", "receptionist"], "appointments")} />
              <Route path="/admin/treatment-plans" element={secureAdminFeature(["admin", "dentist"], "patients")} />
              <Route path="/admin/inventory" element={secureAdminFeature(["admin", "dentist"], "inventory")} />
              <Route path="/admin/leads" element={secureAdminFeature(["admin", "receptionist"], "appointments")} />
              <Route path="/admin/doctors" element={secureAdmin(["admin", "receptionist"])} />
              <Route path="/admin/services" element={secureAdmin(["admin", "receptionist"])} />
              <Route path="/admin/site-builder" element={
                <ProtectedRoute roles={["admin"]} requiredFeature="website">
                  <AdminDashboardPage />
                </ProtectedRoute>
              } />
              <Route path="/admin/users" element={secureAdmin(["admin"])} />

              <Route path="/accounting" element={accountingElement} />
              <Route path="/accounting/invoices" element={accountingElement} />
              <Route path="/accounting/create-invoice" element={accountingElement} />
              <Route path="/accounting/invoice-print" element={accountingElement} />
              <Route path="/accounting/payments" element={accountingElement} />
              <Route path="/accounting/payment-plans" element={accountingElement} />
              <Route path="/accounting/statement" element={accountingElement} />
              <Route path="/accounting/reports" element={accountingElement} />
              <Route path="/accounting/settings" element={accountingElement} />

              <Route path="/booking" element={<Navigate to="/c/lunadent-demo/booking" replace />} />
              <Route path="/patient-portal/*" element={<Navigate to="/c/lunadent-demo/patient" replace />} />
              <Route path="/treatments" element={<Navigate to="/c/lunadent-demo" replace />} />
              <Route path="/doctors" element={<Navigate to="/c/lunadent-demo" replace />} />
              <Route path="/before-after" element={<Navigate to="/c/lunadent-demo" replace />} />
              <Route path="/blog/*" element={<Navigate to="/" replace />} />
              <Route path="/media" element={<Navigate to="/" replace />} />
              <Route path="/calculator" element={<Navigate to="/" replace />} />
              <Route path="/smile-assessment" element={<Navigate to="/" replace />} />
              <Route path="/smile-simulation" element={<Navigate to="/" replace />} />
              <Route path="/contact" element={<Navigate to="/" replace />} />
              <Route path="/journey" element={<Navigate to="/" replace />} />
              <Route path="/technology" element={<Navigate to="/" replace />} />
              <Route path="/privacy" element={<Navigate to="/" replace />} />
              <Route path="/terms" element={<Navigate to="/" replace />} />

              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </AuthProvider>
    </AppErrorBoundary>
  );
}
