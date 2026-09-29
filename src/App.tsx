import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/auth/AuthContext";
import ProtectedRoute from "@/auth/ProtectedRoute";
import StaffLogin from "@/pages/staff/Login";
import Layout from "@/components/Layout";
import Home from "@/pages/Home";
import PatientPortal from "@/pages/PatientPortal";
import PatientPortalLive from "@/pages/PatientPortalLive";
import { isSupabaseConfigured } from "@/lib/supabase";
import AdminDashboardPage from "@/pages/AdminDashboard";
import Accounting from "@/pages/Accounting";
import AccountingLive from "@/pages/AccountingLive";
import Booking from "@/pages/Booking";
import { Blog, BlogDetail } from "@/pages/Blog";
import {
  Treatments, Doctors, BeforeAfterPage, MediaCenter,
  CostCalculator, SmileAssessment, Contact
} from "@/pages/SubPages";

function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--background)" }}>
      <div className="text-center">
        <div className="text-6xl mb-4">🦷</div>
        <h1 className="text-3xl font-bold mb-2" style={{ fontFamily: "'Cormorant Garamond', serif", color: "var(--primary)" }}>
          Page Not Found
        </h1>
        <p className="text-sm mb-6" style={{ color: "var(--muted-foreground)" }}>Looks like this page got lost in the dental chair.</p>
        <a href="/" className="px-6 py-3 rounded-full text-sm font-semibold" style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}>
          Back to Home
        </a>
      </div>
    </div>
  );
}

export default function App() {
  const staffRoles = ["admin", "dentist", "receptionist", "accountant"] as const;
  const adminElement = (
    <ProtectedRoute roles={[...staffRoles]}>
      <AdminDashboardPage />
    </ProtectedRoute>
  );
  const patientPortalElement = isSupabaseConfigured ? <PatientPortalLive /> : <PatientPortal />;
  const accountingPage = isSupabaseConfigured ? <AccountingLive /> : <Accounting />;
  const accountingElement = (
    <ProtectedRoute roles={["admin", "receptionist", "accountant"]}>
      {accountingPage}
    </ProtectedRoute>
  );

  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout><Home /></Layout>} />
          <Route path="/treatments" element={<Layout><Treatments /></Layout>} />
          <Route path="/doctors" element={<Layout><Doctors /></Layout>} />
          <Route path="/before-after" element={<Layout><BeforeAfterPage /></Layout>} />
          <Route path="/booking" element={<Layout><Booking /></Layout>} />
          <Route path="/blog" element={<Layout><Blog /></Layout>} />
          <Route path="/blog/:id" element={<Layout><BlogDetail /></Layout>} />
          <Route path="/media" element={<Layout><MediaCenter /></Layout>} />
          <Route path="/calculator" element={<Layout><CostCalculator /></Layout>} />
          <Route path="/smile-assessment" element={<Layout><SmileAssessment /></Layout>} />
          <Route path="/smile-simulation" element={<Layout><SmileAssessment /></Layout>} />
          <Route path="/contact" element={<Layout><Contact /></Layout>} />
          <Route path="/journey" element={<Layout><Home /></Layout>} />
          <Route path="/technology" element={<Layout><Home /></Layout>} />
          <Route path="/privacy" element={<Layout><Contact /></Layout>} />
          <Route path="/terms" element={<Layout><Contact /></Layout>} />

          <Route path="/staff/login" element={<StaffLogin />} />

          <Route path="/patient-portal/login" element={patientPortalElement} />
          <Route path="/patient-portal" element={patientPortalElement} />
          <Route path="/patient-portal/appointments" element={patientPortalElement} />
          <Route path="/patient-portal/invoices" element={patientPortalElement} />
          <Route path="/patient-portal/payments" element={patientPortalElement} />
          <Route path="/patient-portal/rewards" element={patientPortalElement} />
          <Route path="/patient-portal/documents" element={patientPortalElement} />
          <Route path="/patient-portal/messages" element={patientPortalElement} />
          <Route path="/patient-portal/settings" element={patientPortalElement} />

          <Route path="/admin" element={adminElement} />
          <Route path="/admin/patients" element={adminElement} />
          <Route path="/admin/patients/:patientId" element={adminElement} />
          <Route path="/admin/appointments" element={adminElement} />
          <Route path="/admin/treatment-plans" element={adminElement} />
          <Route path="/admin/inventory" element={adminElement} />
          <Route path="/admin/leads" element={adminElement} />
          <Route path="/admin/doctors" element={adminElement} />
          <Route path="/admin/services" element={adminElement} />
          <Route path="/admin/users" element={<ProtectedRoute roles={["admin"]}><AdminDashboardPage /></ProtectedRoute>} />

          <Route path="/accounting" element={accountingElement} />
          <Route path="/accounting/invoices" element={accountingElement} />
          <Route path="/accounting/create-invoice" element={accountingElement} />
          <Route path="/accounting/invoice-print" element={accountingElement} />
          <Route path="/accounting/payments" element={accountingElement} />
          <Route path="/accounting/payment-plans" element={accountingElement} />
          <Route path="/accounting/statement" element={accountingElement} />
          <Route path="/accounting/reports" element={accountingElement} />
          <Route path="/accounting/settings" element={accountingElement} />

          <Route path="*" element={<Layout><NotFound /></Layout>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
