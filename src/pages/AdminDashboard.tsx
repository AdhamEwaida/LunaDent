import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  Briefcase,
  Calendar,
  ClipboardList,
  CreditCard,
  FileText,
  History,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  Palette,
  Settings,
  Smile,
  Stethoscope,
  Users,
  X,
} from "lucide-react";
import {
  ClinicAppointments,
  ClinicBookingRequests,
  ClinicDashboard,
  ClinicDoctors,
  ClinicInventory,
  ClinicPatients,
  ClinicPatientWorkspace,
  ClinicServices,
  ClinicTreatmentPlans,
  ClinicUsers,
} from "@/pages/ClinicOperations";
import { useAuth } from "@/auth/AuthContext";
import SiteBuilder from "@/pages/SiteBuilder";
import ClinicPlan from "@/pages/ClinicPlan";
import ClinicAuditLog from "@/pages/ClinicAuditLog";

type NavItem = {
  icon: typeof LayoutDashboard;
  label: string;
  path: string;
  section: "main" | "clinic" | "marketing" | "finance" | "admin";
  feature?: string;
};

const ADMIN_NAV: NavItem[] = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/admin", section: "main" },
  { icon: Users, label: "Patients", path: "/admin/patients", section: "main" },
  { icon: Calendar, label: "Appointments", path: "/admin/appointments", section: "main" },
  { icon: Smile, label: "Booking Requests", path: "/admin/leads", section: "main" },
  { icon: ClipboardList, label: "Treatment Plans", path: "/admin/treatment-plans", section: "clinic" },
  { icon: Stethoscope, label: "Doctors", path: "/admin/doctors", section: "clinic" },
  { icon: Briefcase, label: "Treatments", path: "/admin/services", section: "clinic" },
  { icon: Package, label: "Inventory", path: "/admin/inventory", section: "clinic", feature: "inventory" },
  { icon: Palette, label: "Website Builder", path: "/admin/site-builder", section: "marketing", feature: "website" },
  { icon: FileText, label: "Accounting", path: "/accounting", section: "finance", feature: "accounting" },
  { icon: CreditCard, label: "Plan & Usage", path: "/admin/plan", section: "admin" },
  { icon: History, label: "Audit Log", path: "/admin/audit-log", section: "admin" },
];

const SECTIONS = {
  main: "Operations",
  clinic: "Clinical",
  marketing: "Marketing",
  finance: "Finance",
  admin: "Administration",
} as const;

const PAGE_TITLES: Record<string, string> = {
  "/admin": "Dashboard",
  "/admin/patients": "Patients",
  "/admin/appointments": "Appointments",
  "/admin/treatment-plans": "Treatment Plans",
  "/admin/inventory": "Inventory",
  "/admin/leads": "Booking Requests",
  "/admin/doctors": "Doctors",
  "/admin/services": "Treatments",
  "/admin/users": "Users & Access",
  "/admin/site-builder": "Website Builder",
  "/admin/plan": "Plan & Usage",
  "/admin/audit-log": "Audit Log",
};

function AdminSidebar({ open, setOpen }: { open: boolean; setOpen: (value: boolean) => void }) {
  const location = useLocation();
  const navigate = useNavigate();
  const {
    signOut,
    demoMode,
    role,
    isSuperAdmin,
    memberships,
    activeClinic,
    activeClinicId,
    setActiveClinicId,
    entitlements,
    hasFeature,
  } = useAuth();

  const visiblePaths: Record<string, string[]> = {
    dentist: ["/admin", "/admin/patients", "/admin/appointments", "/admin/treatment-plans", "/admin/inventory"],
    receptionist: ["/admin", "/admin/patients", "/admin/appointments", "/admin/leads", "/admin/doctors", "/admin/services", "/accounting"],
    accountant: ["/admin", "/admin/patients", "/accounting"],
  };

  const canSee = (path: string) => role === "admin" || !role || (visiblePaths[role]?.includes(path) ?? false);
  const isActive = (path: string) => path === "/admin"
    ? location.pathname === "/admin"
    : location.pathname === path || location.pathname.startsWith(path + "/");

  const grouped = Object.entries(SECTIONS)
    .map(([key, label]) => ({
      label,
      items: ADMIN_NAV.filter((item) =>
        item.section === key
        && canSee(item.path)
        && (!item.feature || hasFeature(item.feature))
      ),
    }))
    .filter((group) => group.items.length > 0);

  const closeOnMobile = () => setOpen(false);

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.button
            type="button"
            aria-label="Close navigation"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeOnMobile}
            className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          />
        )}
      </AnimatePresence>

      <aside
        className={`fixed bottom-0 left-0 top-0 z-40 flex w-60 flex-col transition-transform duration-300 lg:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}
        style={{ background: "var(--primary)" }}
        aria-label="Clinic workspace navigation"
      >
        <div className="flex items-center justify-between border-b px-4 py-4" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
          <Link to="/admin" onClick={closeOnMobile} className="flex min-w-0 items-center gap-2">
            <div className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-white/15 text-xs font-bold text-white">L</div>
            <span className="truncate text-sm font-bold text-white" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
              {activeClinic?.name || "Clinic Workspace"}
            </span>
          </Link>
          <button type="button" onClick={closeOnMobile} className="text-white/60 lg:hidden" aria-label="Close sidebar">
            <X size={16} />
          </button>
        </div>

        {entitlements?.plan && (
          <div className="px-3 pt-3">
            <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-white/40">Plan</div>
              <div className="mt-0.5 flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-white">{entitlements.plan.name}</span>
                <span className={`text-[10px] font-semibold ${entitlements.usable ? "text-emerald-300" : "text-amber-300"}`}>
                  {entitlements.subscription_status.replaceAll("_", " ")}
                </span>
              </div>
            </div>
          </div>
        )}

        {memberships.length > 1 && (
          <div className="px-3 pt-3">
            <label htmlFor="clinic-switcher" className="text-[10px] font-semibold uppercase tracking-wider text-white/40">
              Current clinic
            </label>
            <select
              id="clinic-switcher"
              value={activeClinicId || ""}
              onChange={(event) => setActiveClinicId(event.target.value)}
              className="mt-1 w-full rounded-lg border-0 bg-white/10 px-2 py-2 text-xs text-white"
            >
              {memberships.map((membership) => (
                <option key={membership.clinic_id} value={membership.clinic_id} className="text-slate-900">
                  {membership.clinic?.name || membership.clinic_id}
                </option>
              ))}
            </select>
          </div>
        )}

        <nav className="flex-1 overflow-y-auto px-3 py-4">
          {grouped.map((group) => (
            <div key={group.label} className="mb-4">
              <div className="mb-1.5 px-2 text-xs font-semibold uppercase tracking-widest text-white/35">
                {group.label}
              </div>
              {group.items.map((item) => {
                const active = isActive(item.path);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={closeOnMobile}
                    className="mb-0.5 flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm transition-all"
                    style={{
                      background: active ? "rgba(255,255,255,0.15)" : "transparent",
                      color: active ? "white" : "rgba(255,255,255,0.62)",
                    }}
                    aria-current={active ? "page" : undefined}
                  >
                    <item.icon size={15} />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="space-y-1 border-t p-3" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
          {role === "admin" && (
            <Link
              to="/admin/users"
              onClick={closeOnMobile}
              className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm"
              style={{
                color: isActive("/admin/users") ? "white" : "rgba(255,255,255,0.72)",
                background: isActive("/admin/users") ? "rgba(255,255,255,0.15)" : "transparent",
              }}
            >
              <Settings size={14} /> Users & Access
            </Link>
          )}
          {isSuperAdmin && (
            <Link to="/super-admin" className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-white/70">
              <LayoutDashboard size={14} /> Super Admin
            </Link>
          )}
          <Link
            to={activeClinic ? `/c/${activeClinic.slug}` : "/"}
            className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-white/50"
          >
            <Smile size={14} /> Clinic Website
          </Link>
          {!demoMode && (
            <button
              type="button"
              onClick={async () => {
                await signOut();
                navigate("/staff/login", { replace: true });
              }}
              className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-white/50"
            >
              <LogOut size={14} /> Sign Out
            </button>
          )}
        </div>
      </aside>
    </>
  );
}

function AdminHeader({ title, setOpen }: { title: string; setOpen: (value: boolean) => void }) {
  const { user, role, activeClinicRole } = useAuth();
  const displayName = String(user?.user_metadata?.full_name || user?.email || role || "Staff");
  const initials = displayName
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "ST";
  const roleLabel = activeClinicRole === "clinic_owner"
    ? "Clinic Owner"
    : role
      ? role.charAt(0).toUpperCase() + role.slice(1)
      : "Staff";

  return (
    <header className="flex h-14 items-center gap-3 border-b px-4" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-lg p-1.5 lg:hidden"
        style={{ color: "var(--primary)" }}
        aria-label="Open navigation"
      >
        <Menu size={18} />
      </button>
      <h1 className="text-base font-semibold" style={{ color: "var(--foreground)" }}>{title}</h1>
      <div className="flex-1" />
      <div className="hidden items-center gap-2 text-sm md:flex" style={{ color: "var(--foreground)" }}>
        <div className="grid h-7 w-7 place-items-center rounded-full text-xs font-bold text-white" style={{ background: "var(--accent)" }}>
          {initials}
        </div>
        <span className="text-xs">{roleLabel}</span>
      </div>
    </header>
  );
}

export default function AdminDashboardPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const title = location.pathname.startsWith("/admin/patients/")
    ? "Patient Record"
    : PAGE_TITLES[location.pathname] || "Clinic Workspace";

  const renderContent = () => {
    const path = location.pathname;
    if (path === "/admin") return <ClinicDashboard />;
    if (path === "/admin/patients") return <ClinicPatients />;
    if (path.startsWith("/admin/patients/")) return <ClinicPatientWorkspace />;
    if (path === "/admin/appointments") return <ClinicAppointments />;
    if (path === "/admin/treatment-plans") return <ClinicTreatmentPlans />;
    if (path === "/admin/inventory") return <ClinicInventory />;
    if (path === "/admin/leads") return <ClinicBookingRequests />;
    if (path === "/admin/doctors") return <ClinicDoctors />;
    if (path === "/admin/services") return <ClinicServices />;
    if (path === "/admin/users") return <ClinicUsers />;
    if (path === "/admin/site-builder") return <SiteBuilder />;
    if (path === "/admin/plan") return <ClinicPlan />;
    if (path === "/admin/audit-log") return <ClinicAuditLog />;
    return <ClinicDashboard />;
  };

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "var(--background)" }}>
      <AdminSidebar open={sidebarOpen} setOpen={setSidebarOpen} />
      <div className="flex flex-1 flex-col overflow-hidden lg:ml-60">
        <AdminHeader title={title} setOpen={setSidebarOpen} />
        <main className="flex-1 overflow-y-auto p-4 md:p-5">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}
