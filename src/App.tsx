import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "@/auth/AuthContext";
import ProtectedRoute from "@/auth/ProtectedRoute";
import SuperAdminRoute from "@/auth/SuperAdminRoute";
import StaffLogin from "@/pages/staff/Login";
import StaffChangePassword from "@/pages/staff/ChangePassword";
import PatientPortalLive from "@/pages/PatientPortalLive";
import { CompletePatientProfile, PatientSignup } from "@/pages/patient/Signup";
import AdminDashboardPage from "@/pages/AdminDashboard";
import AccountingLive from "@/pages/AccountingLive";
import SaasLanding from "@/pages/SaasLanding";
import SuperAdmin from "@/pages/SuperAdmin";
import ClinicSite from "@/pages/ClinicSite";
import ClinicBooking from "@/pages/ClinicBooking";

function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-5">
      <div className="text-center">
        <div className="text-6xl mb-4">🦷</div>
        <h1 className="text-3xl font-bold mb-2">Page Not Found</h1>
        <p className="text-sm mb-6 text-slate-500">The page you requested does not exist.</p>
        <a href="/" className="px-6 py-3 rounded-xl text-sm font-semibold bg-slate-950 text-white">Back to LunaDent</a>
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

  const accountingElement = (
    <ProtectedRoute roles={["admin", "receptionist", "accountant"]}>
      <AccountingLive />
    </ProtectedRoute>
  );

  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* LunaDent SaaS */}
          <Route path="/" element={<SaasLanding />} />
          <Route path="/super-admin" element={<SuperAdminRoute><SuperAdmin /></SuperAdminRoute>} />

          {/* Public clinic websites */}
          <Route path="/c/:clinicSlug" element={<ClinicSite />} />
          <Route path="/c/:clinicSlug/booking" element={<ClinicBooking />} />

          {/* Clinic-specific patient access */}
          <Route path="/c/:clinicSlug/patient/login" element={<PatientPortalLive />} />
          <Route path="/c/:clinicSlug/patient/signup" element={<PatientSignup />} />
          <Route path="/c/:clinicSlug/patient/complete-profile" element={<CompletePatientProfile />} />
          <Route path="/c/:clinicSlug/patient" element={<PatientPortalLive />} />
          <Route path="/c/:clinicSlug/patient/appointments" element={<PatientPortalLive />} />
          <Route path="/c/:clinicSlug/patient/invoices" element={<PatientPortalLive />} />
          <Route path="/c/:clinicSlug/patient/payments" element={<PatientPortalLive />} />
          <Route path="/c/:clinicSlug/patient/documents" element={<PatientPortalLive />} />

          {/* Staff authentication */}
          <Route path="/staff/login" element={<StaffLogin />} />
          <Route path="/staff/change-password" element={
            <ProtectedRoute roles={[...staffRoles]}>
              <StaffChangePassword />
            </ProtectedRoute>
          } />

          {/* Clinic workspace */}
          <Route path="/admin" element={secureAdmin([...staffRoles])} />
          <Route path="/admin/patients" element={secureAdmin([...staffRoles])} />
          <Route path="/admin/patients/:patientId" element={secureAdmin([...staffRoles])} />
          <Route path="/admin/appointments" element={secureAdmin(["admin", "dentist", "receptionist"])} />
          <Route path="/admin/treatment-plans" element={secureAdmin(["admin", "dentist"])} />
          <Route path="/admin/inventory" element={secureAdmin(["admin", "dentist"])} />
          <Route path="/admin/leads" element={secureAdmin(["admin", "receptionist"])} />
          <Route path="/admin/doctors" element={secureAdmin(["admin", "receptionist"])} />
          <Route path="/admin/services" element={secureAdmin(["admin", "receptionist"])} />
          <Route path="/admin/site-builder" element={secureAdmin(["admin"])} />
          <Route path="/admin/users" element={secureAdmin(["admin"])} />

          {/* Clinic accounting */}
          <Route path="/accounting" element={accountingElement} />
          <Route path="/accounting/invoices" element={accountingElement} />
          <Route path="/accounting/create-invoice" element={accountingElement} />
          <Route path="/accounting/invoice-print" element={accountingElement} />
          <Route path="/accounting/payments" element={accountingElement} />
          <Route path="/accounting/payment-plans" element={accountingElement} />
          <Route path="/accounting/statement" element={accountingElement} />
          <Route path="/accounting/reports" element={accountingElement} />
          <Route path="/accounting/settings" element={accountingElement} />

          {/* Compatibility redirects from the original single-clinic product */}
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
      </BrowserRouter>
    </AuthProvider>
  );
}
